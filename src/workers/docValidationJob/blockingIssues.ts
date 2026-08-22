import { createDocValidationIssue } from "../../database/repositories/docValidationIssueRepository";
import {
  DocValidationCrossCheckResult,
  DocValidationExtractionResult,
  DocValidationMatchedInvoice,
} from "../../modules/docValidation/types";

// Tolerância de divergência entre o peso líquido total das notas fiscais e dos tickets de
// balança, em percentual do peso dos tickets. A ordem de carregamento NÃO entra nessa
// comparação — seu netWeightKg é PREVISTO, não aferido (ver LoadingOrderExtractedFields), então
// não é uma fonte confiável pra validar peso real. O ticket é usado como base do percentual por
// ser o peso AFERIDO (pesagem na balança); a nota fiscal é só declarada.
const NET_WEIGHT_TOLERANCE_PERCENT = 5;

function sumPresentNetWeightKg(
  docs: { present: boolean; netWeightKg?: number | null }[],
): number | null {
  const values = docs
    .filter((doc): doc is { present: true; netWeightKg?: number | null } => doc.present)
    .map((doc) => doc.netWeightKg)
    .filter((weight): weight is number => weight !== null && weight !== undefined);

  if (!values.length) return null;

  return values.reduce((sum, weight) => sum + weight, 0);
}

function exceedsNetWeightTolerance(weighingTicketsNetWeightKg: number, invoicesNetWeightKg: number): boolean {
  if (weighingTicketsNetWeightKg === 0) return invoicesNetWeightKg !== 0;
  return (
    (Math.abs(weighingTicketsNetWeightKg - invoicesNetWeightKg) / weighingTicketsNetWeightKg) * 100 >
    NET_WEIGHT_TOLERANCE_PERCENT
  );
}

// Mensagens bloqueantes: quando alguma existir, o webhook vai com success:false e essas
// mensagens direto no corpo (payload.message), sem o restante dos dados em "data".
export async function collectBlockingIssues(
  dvaCode: string,
  crossCheck: DocValidationCrossCheckResult,
  matchedInvoice: DocValidationMatchedInvoice,
  extraction: DocValidationExtractionResult,
): Promise<string[]> {
  const blockingMessages: string[] = [];

  if (!crossCheck.contract.match) {
    const message = `O contrato da nota fiscal (${crossCheck.contract.invoice}) é diferente do contrato enviado pelo cliente (${crossCheck.contract.declared}).`;

    await createDocValidationIssue(
      dvaCode,
      "CONTRACT_MISMATCH",
      message,
      { sendContract: crossCheck.contract.declared, invoice: crossCheck.contract.invoice },
    );

    blockingMessages.push(message);
  }

  // Documento é o sinal decisivo: bloqueia tanto quando a nota escolhida bate só pelo nome
  // (recipientDocumentMatch false com found true) quanto quando nenhuma nota corresponde ao
  // destinatário declarado (found false, invoiceName/invoiceDocument nulos).
  if (!matchedInvoice.recipientDocumentMatch) {
    const message = matchedInvoice.found
      ? `O destinatário da nota fiscal (${matchedInvoice.invoiceName} - ${matchedInvoice.invoiceDocument}) é diferente do destinatário enviado pelo cliente (${matchedInvoice.declaredName} - ${matchedInvoice.declaredDocument}).`
      : `Nenhuma nota fiscal com o destinatário enviado pelo cliente (${matchedInvoice.declaredName} - ${matchedInvoice.declaredDocument}) foi encontrada no documento.`;

    await createDocValidationIssue(
      dvaCode,
      "RECIPIENT_MISMATCH",
      message,
      {
        sendRecipientName: matchedInvoice.declaredName,
        sendRecipientDocument: matchedInvoice.declaredDocument,
        invoiceRecipientName: matchedInvoice.invoiceName,
        invoiceRecipientDocument: matchedInvoice.invoiceDocument,
      },
    );

    blockingMessages.push(message);
  }

  if (crossCheck.plate.confidencePercent < 90) {
    const message = `A placa declarada (${crossCheck.plate.declared}) não pôde ser confirmada com segurança nos documentos (confiança de ${crossCheck.plate.confidencePercent}%).`;

    await createDocValidationIssue(
      dvaCode,
      "PLATE_LOW_CONFIDENCE",
      message,
      {
        declaredPlate: crossCheck.plate.declared,
        invoicePlate: crossCheck.plate.invoice,
        loadingOrderPlate: crossCheck.plate.loadingOrder,
        weighingTicketPlate: crossCheck.plate.weighingTicket,
        confidencePercent: crossCheck.plate.confidencePercent,
      },
    );

    blockingMessages.push(message);
  }

  // Compara o peso líquido total das notas fiscais com o total dos tickets de balança
  // (ordem de carregamento não entra — ver comentário de NET_WEIGHT_TOLERANCE_PERCENT). Se
  // nenhuma nota ou nenhum ticket tiver netWeightKg preenchido, pula a comparação em vez de
  // bloquear por dado ausente (evita falso positivo por falha de extração do OCR).
  const invoicesNetWeightKg = sumPresentNetWeightKg(extraction.invoices);
  const weighingTicketsNetWeightKg = sumPresentNetWeightKg(extraction.weighingTickets);

  if (
    invoicesNetWeightKg !== null &&
    weighingTicketsNetWeightKg !== null &&
    exceedsNetWeightTolerance(weighingTicketsNetWeightKg, invoicesNetWeightKg)
  ) {
    const message = `O peso líquido total das notas fiscais (${invoicesNetWeightKg} kg) diverge do total dos tickets de balança (${weighingTicketsNetWeightKg} kg) em mais de ${NET_WEIGHT_TOLERANCE_PERCENT}%.`;

    await createDocValidationIssue(dvaCode, "NET_WEIGHT_MISMATCH", message, {
      invoicesNetWeightKg,
      weighingTicketsNetWeightKg,
    });

    blockingMessages.push(message);
  }

  return blockingMessages;
}
