import { findDocValidationByCode } from "../../../database/repositories/docValidationRepository";

// STUB: o contrato real da API pública de entrada do PHIORI (URL, autenticação, schema do corpo)
// ainda não foi definido aqui — ver docs/superpowers/specs/2026-09-03-api-publica-de-entrada-design.md
// no repositório da API, que não está disponível neste projeto. Até lá, toda tentativa falha de
// propósito (e fica registrada em dinLastError) em vez de fingir sucesso, para o job não relatar
// como enviado algo que nunca saiu daqui.
export async function sendToPhiori(dvaCode: string): Promise<void> {
  const docValidation = await findDocValidationByCode(dvaCode);

  if (!docValidation) {
    throw new Error(`doc_validation ${dvaCode} não encontrada para envio ao PHIORI`);
  }

  throw new Error(
    "Envio ao PHIORI ainda não implementado: falta o contrato da API pública de entrada (URL/autenticação/schema)."
  );
}
