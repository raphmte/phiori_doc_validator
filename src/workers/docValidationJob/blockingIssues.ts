import { createDocValidationIssue } from "../../database/repositories/docValidationIssueRepository";
import {
  DocValidationCrossCheckResult,
  DocValidationMatchedInvoice,
} from "../../modules/docValidation/types";

// Mensagens bloqueantes: quando alguma existir, o webhook vai com success:false e essas
// mensagens direto no corpo (payload.message), sem o restante dos dados em "data".
export async function collectBlockingIssues(
  dvaCode: string,
  crossCheck: DocValidationCrossCheckResult,
  matchedInvoice: DocValidationMatchedInvoice,
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

  return blockingMessages;
}
