import {
  DeclaredDocumentData,
  DocValidationCrossCheckResult,
  DocValidationMatchedInvoice,
  DocValidationSenderComparison,
} from "../../modules/docValidation/types";
import { maskCpfCnpj } from "../../modules/docValidation/normalizeDocument";

// declaredName/declaredDocument nunca vêm da IA — são sempre os valores que a gente mesma
// recebeu em declaredData (já com máscara, ver createDocValidationController), então
// sobrescrever aqui garante consistência mesmo se a IA ecoar errado. invoiceDocument (CPF/CNPJ
// extraído da nota) sempre volta só com dígitos da extração — aplicamos a máscara aqui em vez
// de confiar que a IA formate certo.
export function applyDeclaredOverrides(
  crossCheck: DocValidationCrossCheckResult,
  declaredData: DeclaredDocumentData,
): {
  sender: DocValidationSenderComparison;
  matchedInvoice: DocValidationMatchedInvoice;
} {
  const sender: DocValidationSenderComparison = {
    ...crossCheck.sender,
    declaredName: declaredData.invoiceSenderName,
    declaredDocument: declaredData.invoiceSenderDocument,
    invoiceDocument: crossCheck.sender.invoiceDocument
      ? maskCpfCnpj(crossCheck.sender.invoiceDocument)
      : null,
  };

  const matchedInvoice: DocValidationMatchedInvoice = {
    ...crossCheck.matchedInvoice,
    declaredName: declaredData.invoiceRecipientName,
    declaredDocument: declaredData.invoiceRecipientDocument,
    invoiceDocument: crossCheck.matchedInvoice.invoiceDocument
      ? maskCpfCnpj(crossCheck.matchedInvoice.invoiceDocument)
      : null,
  };

  return { sender, matchedInvoice };
}
