import { findDeclaredDataByDvaCode } from "../database/repositories/docValidationDeclaredDataRepository";
import { findFilesByDvaCode } from "../database/repositories/docValidationFileRepository";
import {
  DocValidation,
  MAX_DOC_VALIDATION_ATTEMPTS,
  markDocValidationAsDone,
  markDocValidationAsFailed,
} from "../database/repositories/docValidationRepository";
import DeepSeekHelper from "../helpers/DeepSeekHelper";
import GoogleDocumentAIOcr from "../helpers/GoogleDocumentAIOcr";
import PdfMergeHelper from "../helpers/PdfMergeHelper";
import R2StorageHelper from "../helpers/R2StorageHelper";
import {
  DocValidationCrossCheckResult,
  DocValidationExtractedData,
  DocValidationExtractionResult,
  DocValidationResult,
} from "../modules/docValidation/types";
import {
  DOC_VALIDATION_CROSS_CHECK_PROMPT,
  DOC_VALIDATION_EXTRACTION_PROMPT,
} from "./prompt";
import { sendDocValidationWebhook } from "../modules/docValidation/services/sendDocValidationWebhookService";
import { createDocValidationIntegration } from "../database/repositories/docValidationIntegrationRepository";
import { INTEGRATION_SYSTEMS } from "../modules/integrations/integrationTypes";
import { dedupeInvoicesByAccessKey } from "./docValidationJob/dedupeInvoices";
import { dedupeWeighingTicketsByTicketNumber } from "./docValidationJob/dedupeWeighingTickets";
import { correctInvoiceTotalValues } from "./docValidationJob/correctInvoiceTotalValue";
import { applyDeclaredOverrides } from "./docValidationJob/declaredOverrides";
import { collectBlockingIssues } from "./docValidationJob/blockingIssues";
import { buildWebhookPayload } from "./docValidationJob/webhookPayload";

export async function processDocValidationJob(
  job: DocValidation,
): Promise<void> {
  try {
    // Bulk: 1 arquivo só (dvaFileKey). Split: doc_validation_files tem os arquivos separados
    // (ordem de carregamento, ticket de balança, notas) e eles são combinados num PDF só aqui,
    // já que a extração via Document AI + DeepSeek sempre trabalha em cima de um único documento.
    const buffer = job.dvaFileKey
      ? await R2StorageHelper.getFileBuffer(job.dvaFileKey)
      : await mergeSplitFiles(job.dvaCode);

    const { pages } = await GoogleDocumentAIOcr.extractTextWithDocumentAI(
      buffer,
      job.dvaFileMimetype ?? "application/pdf",
    );

    const declaredData = (await findDeclaredDataByDvaCode(job.dvaCode))!;

    // Duas chamadas em vez de uma: o modelo usado não tem modo "thinking", e num prompt único
    // ele não conseguia extrair os documentos corretamente E acertar a validação cruzada ao
    // mesmo tempo. O problema maior aparecia com PDFs com múltiplas notas fiscais: mesmo com
    // instrução explícita de comparar dígito a dígito, o modelo errava a identificação da NF
    // correta (matchedInvoice.recipientDocumentMatch saía true mesmo quando o documento
    // declarado e o da nota divergiam). Isolar essa comparação numa 2ª chamada dedicada, sem
    // o ruído do OCR bruto e da extração dos outros campos, tornou o resultado bem mais
    // confiável.
    const extraction =
      await DeepSeekHelper.callDeepSeek<DocValidationExtractionResult>(
        DOC_VALIDATION_EXTRACTION_PROMPT,
        { pages },
      );

    extraction.invoices = dedupeInvoicesByAccessKey(extraction.invoices ?? []);
    extraction.invoices = correctInvoiceTotalValues(extraction.invoices);
    extraction.weighingTickets = dedupeWeighingTicketsByTicketNumber(
      extraction.weighingTickets ?? [],
    );

    console.log(
      `DocValidation job ${job.dvaCode} resultado da extração do DeepSeek:`,
      JSON.stringify(extraction),
    );

    // Documentos que a extração não encontrou no PDF ("present": false, ou nenhuma nota/ticket
    // no array). No bulk o cliente manda um único arquivo com tudo junto, então não dá pra
    // apontar qual pedaço faltou — reporta só "bulk": false.
    const filePresence = {
      loadingOrder: extraction.loadingOrder.present,
      weighingTicket: extraction.weighingTickets.length > 0,
      invoice: extraction.invoices.length > 0,
    };
    const hasMissingFile = Object.values(filePresence).some((present) => !present);

    const crossCheck =
      await DeepSeekHelper.callDeepSeek<DocValidationCrossCheckResult>(
        DOC_VALIDATION_CROSS_CHECK_PROMPT,
        {
          declaredData,
          extraction,
        },
      );

    console.log(
      `DocValidation job ${job.dvaCode} resultado da validação cruzada do DeepSeek:`,
      JSON.stringify(crossCheck),
    );

    const { matchedInvoice } = applyDeclaredOverrides(crossCheck, declaredData);

    const blockingMessages = await collectBlockingIssues(
      job.dvaCode,
      crossCheck,
      matchedInvoice,
      extraction,
    );

    const validation: DocValidationResult = {
      matchedInvoice,
      plate: crossCheck.plate,
      contract: crossCheck.contract,
    };

    const result: DocValidationExtractedData = {
      loadingOrder: extraction.loadingOrder,
      invoices: extraction.invoices,
      weighingTickets: extraction.weighingTickets,
      validation,
    };

    await markDocValidationAsDone(job.dvaCode, pages, result);

    const payload = hasMissingFile
      ? {
          success: false,
          validationId: job.dvaCode,
          files: job.dvaFileKey ? { bulk: false } : filePresence,
          message: "Não foi possível validar um ou mais documentos enviados.",
        }
      : blockingMessages.length > 0
        ? { success: false, validationId: job.dvaCode, message: blockingMessages.join(" ") }
        : {
            success: true,
            validationId: job.dvaCode,
            data: buildWebhookPayload(extraction, declaredData, matchedInvoice),
          };

    await sendDocValidationWebhook({
      claCode: job.claCode,
      dvaCode: job.dvaCode,
      payload,
    });

    // Só entra na fila de integrações quando a validação terminou com sucesso: dado bloqueado ou
    // com arquivo faltante não é resultado pronto para seguir para outro sistema.
    if (payload.success) {
      await createDocValidationIntegration({
        dvaCode: job.dvaCode,
        system: INTEGRATION_SYSTEMS.PHIORI,
      });
    }
  } catch (e: any) {
    console.error(`DocValidation job ${job.dvaCode} falhou:`, e);

    await markDocValidationAsFailed(
      job.dvaCode,
      job.dvaAttempts,
      e?.message ?? "Erro desconhecido",
    );

    // job.dvaAttempts já inclui a tentativa atual (incrementado em
    // markDocValidationsAsProcessing antes do job rodar) — se ela esgotou o limite, não haverá
    // retry, então avisa o cliente aqui pra ele não ficar esperando um webhook que nunca chega.
    if (job.dvaAttempts >= MAX_DOC_VALIDATION_ATTEMPTS) {
      await sendDocValidationWebhook({
        claCode: job.claCode,
        dvaCode: job.dvaCode,
        payload: {
          success: false,
          validationId: job.dvaCode,
          message: "Não foi possível concluir a validação do documento.",
        },
      });
    }
  }
}

async function mergeSplitFiles(dvaCode: string): Promise<Buffer> {
  const files = await findFilesByDvaCode(dvaCode);

  const buffers = await Promise.all(
    files.map((file) => R2StorageHelper.getFileBuffer(file.dvfFileKey)),
  );

  return PdfMergeHelper.mergePdfBuffers(buffers);
}
