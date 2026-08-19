import { findDeclaredDataByDvaCode } from "../database/repositories/docValidationDeclaredDataRepository";
import { findFilesByDvaCode } from "../database/repositories/docValidationFileRepository";
import {
  DocValidation,
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
import { dedupeInvoicesByAccessKey } from "./docValidationJob/dedupeInvoices";
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

    console.log(
      `DocValidation job ${job.dvaCode} resultado da extração do DeepSeek:`,
      JSON.stringify(extraction),
    );

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

    const { sender, matchedInvoice } = applyDeclaredOverrides(crossCheck, declaredData);

    const blockingMessages = await collectBlockingIssues(
      job.dvaCode,
      crossCheck,
      sender,
      matchedInvoice,
    );

    const weightsMatch =
      !crossCheck.grossWeightKg.needsUpdate &&
      !crossCheck.tareWeightKg.needsUpdate &&
      !crossCheck.netWeightKg.needsUpdate;

    const validation: DocValidationResult = {
      matchedInvoice,
      plate: crossCheck.plate,
      contract: crossCheck.contract,
      sender,
    };

    const result: DocValidationExtractedData = {
      loadingOrder: extraction.loadingOrder,
      invoices: extraction.invoices,
      weighingTicket: extraction.weighingTicket,
      cnh: extraction.cnh,
      validation,
    };

    await markDocValidationAsDone(job.dvaCode, pages, result, weightsMatch);

    const payload =
      blockingMessages.length > 0
        ? { success: false, validationId: job.dvaCode, message: blockingMessages.join(" ") }
        : {
            success: true,
            validationId: job.dvaCode,
            data: buildWebhookPayload(crossCheck),
          };

    await sendDocValidationWebhook({
      claCode: job.claCode,
      dvaCode: job.dvaCode,
      payload,
    });
  } catch (e: any) {
    console.error(`DocValidation job ${job.dvaCode} falhou:`, e);

    await markDocValidationAsFailed(
      job.dvaCode,
      job.dvaAttempts,
      e?.message ?? "Erro desconhecido",
    );
  }
}

async function mergeSplitFiles(dvaCode: string): Promise<Buffer> {
  const files = await findFilesByDvaCode(dvaCode);

  const buffers = await Promise.all(
    files.map((file) => R2StorageHelper.getFileBuffer(file.dvfFileKey)),
  );

  return PdfMergeHelper.mergePdfBuffers(buffers);
}
