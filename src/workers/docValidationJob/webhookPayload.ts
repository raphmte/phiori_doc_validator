import { DocValidationExtractionResult } from "../../modules/docValidation/types";

// Monta o conteúdo de "data" do payload (só usado quando não há nenhuma mensagem bloqueante —
// ver blockingMessages em processDocValidationJob). Diferente do fluxo antigo (que comparava
// declaredData com o extraído e mandava só o diff), agora o cliente não manda mais cadastro pra
// comparar — a gente só repassa o que foi extraído dos documentos do PDF.
export function buildWebhookPayload(
  extraction: DocValidationExtractionResult,
): Record<string, unknown> {
  return {
    loadingOrder: extraction.loadingOrder,
    invoices: extraction.invoices,
    weighingTicket: extraction.weighingTicket,
    cnh: extraction.cnh,
  };
}
