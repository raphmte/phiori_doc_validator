export interface DeclaredDocumentData {
  contract: string;
  plate: string;
  invoiceRecipientName: string;
  invoiceRecipientDocument: string;
}

// Campos extraídos da Ordem de Carregamento. Peso bruto/tara, contrato, chave de acesso e dados
// de nota fiscal NÃO entram aqui — nenhum deles é usado na comparação (contrato e chave de acesso
// comparam sempre contra a nota fiscal, nunca contra a Ordem de Carregamento), e o prompt de
// extração instrui a IA a nem retorná-los para esse documento (ver DOC_VALIDATION_EXTRACTION_PROMPT).
// netWeightKg é exceção: vem da quantidade/peso PREVISTO da carga (não aferido), usado como
// fallback na comparação de peso quando não há Ticket de Balança ou a NF também não traz o líquido
// (ver DOC_VALIDATION_EXTRACTION_PROMPT/DOC_VALIDATION_CROSS_CHECK_PROMPT em processDocValidationJob.ts).
export interface LoadingOrderExtractedFields {
  loadingOrder: number | null;
  plate: string | null;
  driverName: string | null;
  driverDocument: string | null;
  driverPhone: string | null;
  netWeightKg: number | null;
  productDescription: string | null;
}

// Campos extraídos do Ticket de Balança. Não tem ordem de carregamento, chave de acesso nem
// dados de nota fiscal — o prompt instrui a IA a nunca extraí-los desse documento.
export interface TicketExtractedFields {
  plate: string | null;
  grossWeightKg: number | null;
  tareWeightKg: number | null;
  netWeightKg: number | null;
  contract: string | null;
  driverName: string | null;
  driverDocument: string | null;
  ticketNumber: string | null;
  product: string | null;
  moisture: string | null;
  impurity: string | null;
  brokenGrains: string | null;
  damagedGrains: string | null;
  greenishGrains: string | null;
}

// Campos extraídos da Nota Fiscal (DANFE). Não tem tara separada nem ordem de carregamento — o
// prompt instrui a IA a nunca extraí-los desse documento.
export interface InvoiceExtractedFields {
  plate: string | null;
  grossWeightKg: number | null;
  netWeightKg: number | null;
  contract: string | null;
  accessKey: string | null;
  driverName: string | null;
  driverDocument: string | null;
  invoiceRecipientName: string | null;
  invoiceRecipientDocument: string | null;
  invoiceDate: string | null;
  invoiceUnitValue: number | null;
  invoiceTotalValue: number | null;
  productDescription: string | null;
  additionalInfo: string | null;
  natureOperation: string | null;
  series: string | null;
  totalProductsValue: string | null;
  freightMode: string | null;
  cfop: string | null;
  icmsBaseValue: number | null;
  icmsValue: number | null;
  icmsRetainedValue: number | null;
  issuerName: string | null;
  issuerDocument: string | null;
  issuerAddress: string | null;
  issuerCity: string | null;
  issuerState: string | null;
  issuerCep: string | null;
  issuerStateRegistration: string | null;
  issuerPhone: string | null;
  recipientAddress: string | null;
  recipientCity: string | null;
  recipientState: string | null;
  recipientCep: string | null;
  recipientStateRegistration: string | null;
  carrierName: string | null;
  carrierDocument: string | null;
  carrierAddress: string | null;
  carrierCity: string | null;
  carrierState: string | null;
  carrierStateRegistration: string | null;
}

// Quando "present" é false, nenhum outro campo é retornado. Quando true, os campos fixos de
// TFields sempre existem (nulos se não encontrados) e qualquer outro campo que a IA encontre
// nesse documento (variam por layout de cada emissor) vai em "extraFields", para normalização futura.
export type DocValidationExtractedDocument<TFields extends object> =
  | ({ present: true; extraFields: Record<string, unknown> } & TFields)
  | { present: false };

// Identifica, entre as notas extraídas em "invoices", quais são as corretas para declaredData.
// Pode haver mais de uma NF correta (mesmo destinatário, chaves de acesso diferentes) — nesse
// caso "accessKeys" tem mais de um item. "found" prioriza documento idêntico
// (recipientDocumentMatch): quando pelo menos uma nota bate no documento, TODAS as que baterem
// entram em "accessKeys". Só cai no fallback por nome (recipientDocumentMatch fica false) quando
// NENHUMA nota bate no documento e alguma tem nome com similaridade >= 80% — nesse caso apenas
// uma nota (a de maior similaridade) entra em "accessKeys". "recipientNameSimilarityPercent" só é
// null quando não há nenhuma nota fiscal presente no PDF — ver DOC_VALIDATION_CROSS_CHECK_PROMPT.
// "declaredName"/"declaredDocument" e "invoiceName"/"invoiceDocument" espelham o par
// declarado-vs-encontrado — sempre sobrescritos em processDocValidationJob.ts a partir de
// declaredData/extraction (nunca confiados direto na resposta da IA), para garantir que
// documentos saiam sempre com máscara.
export interface DocValidationMatchedInvoice {
  found: boolean;
  accessKeys: string[];
  declaredName: string;
  declaredDocument: string;
  invoiceName: string | null;
  invoiceDocument: string | null;
  recipientDocumentMatch: boolean;
  recipientNameSimilarityPercent: number | null;
}

export interface DocValidationContractComparison {
  declared: string | null;
  invoice: string | null;
  match: boolean;
}

export interface DocValidationPlateComparison {
  declared: string | null;
  invoice: string | null;
  loadingOrder: string | null;
  weighingTicket: string | null;
  confidencePercent: number;
}

// Resultado da validação cruzada salvo em doc_validation_results.dvrData — identifica se a nota
// correta foi encontrada (matchedInvoice) e se placa/contrato batem com o declarado. Não há mais
// diff campo a campo pra atualização de cadastro: o webhook agora manda direto o que foi
// extraído dos documentos (ver processDocValidationJob.ts).
export interface DocValidationResult {
  matchedInvoice: DocValidationMatchedInvoice;
  plate: DocValidationPlateComparison;
  contract: DocValidationContractComparison;
}

export interface DocValidationExtractedData {
  loadingOrder: DocValidationExtractedDocument<LoadingOrderExtractedFields>;
  invoices: DocValidationExtractedDocument<InvoiceExtractedFields>[];
  weighingTicket: DocValidationExtractedDocument<TicketExtractedFields>;
  validation: DocValidationResult;
}

// Resultado da 1ª chamada ao DeepSeek: só extração/normalização dos documentos do PDF (sem
// declaredData). Não identifica a nota fiscal correta nem faz nenhuma comparação — ver
// DocValidationCrossCheckResult.
export interface DocValidationExtractionResult {
  loadingOrder: DocValidationExtractedDocument<LoadingOrderExtractedFields>;
  invoices: DocValidationExtractedDocument<InvoiceExtractedFields>[];
  weighingTicket: DocValidationExtractedDocument<TicketExtractedFields>;
}

// Resultado da 2ª chamada ao DeepSeek: recebe declaredData + o resultado da 1ª chamada e faz,
// nessa ordem, toda comparação que depende de declaredData — identificação da nota fiscal
// correta (matchedInvoice) e as comparações cruzadas de placa e contrato.
export interface DocValidationCrossCheckResult {
  matchedInvoice: DocValidationMatchedInvoice;
  plate: DocValidationPlateComparison;
  contract: DocValidationContractComparison;
}
