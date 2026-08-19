import {
  DeclaredDocumentData,
  DocValidationCrossCheckResult,
  DocValidationMatchedInvoice,
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
  matchedInvoice: DocValidationMatchedInvoice;
} {
  const matchedInvoice: DocValidationMatchedInvoice = {
    ...crossCheck.matchedInvoice,
    declaredName: declaredData.cliName,
    declaredDocument: declaredData.cliDocument,
    invoiceDocument: crossCheck.matchedInvoice.invoiceDocument
      ? maskCpfCnpj(crossCheck.matchedInvoice.invoiceDocument)
      : null,
  };

  return { matchedInvoice };
}
