export interface DeclaredDocumentData {
  plate: string;
  grossWeightKg: number | null;
  tareWeightKg: number | null;
  netWeightKg: number | null;
  loadingOrder: number | null;
  contract: string | null;
  accessKey: string | null;
  driverName: string | null;
  driverDocument: string | null;
  driverPhone: string | null;
  invoiceRecipientName: string;
  invoiceRecipientDocument: string;
  invoiceSenderName: string;
  invoiceSenderDocument: string;
  invoiceDate: string | null;
  invoiceUnitValue: number | null;
  invoiceTotalValue: number | null;
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

// A CNH não tem regras de extração específicas hoje além da identidade do motorista — o resto
// do que a IA achar nela cai em "extraFields".
export interface CnhExtractedFields {
  driverName: string | null;
  driverDocument: string | null;
}

// Quando "present" é false, nenhum outro campo é retornado. Quando true, os campos fixos de
// TFields sempre existem (nulos se não encontrados) e qualquer outro campo que a IA encontre
// nesse documento (variam por layout de cada emissor) vai em "extraFields", para normalização futura.
export type DocValidationExtractedDocument<TFields extends object> =
  | ({ present: true; extraFields: Record<string, unknown> } & TFields)
  | { present: false };

// Identifica, entre as notas extraídas em "invoices", quais são as corretas para declaredData.
// Pode haver mais de uma NF correta (mesmo destinatário, chaves de acesso diferentes) — nesse
// caso "accessKeys" tem mais de um item e os pesos das NFs correspondentes são somados na
// comparação de peso (ver DocValidationFieldCheck). "found" prioriza documento idêntico
// (recipientDocumentMatch): quando pelo menos uma nota bate no documento, TODAS as que baterem
// entram em "accessKeys". Só cai no fallback por nome (recipientDocumentMatch fica false) quando
// NENHUMA nota bate no documento e alguma tem nome com similaridade >= 80% — nesse caso apenas
// uma nota (a de maior similaridade) entra em "accessKeys". "recipientNameSimilarityPercent" só é
// null quando não há nenhuma nota fiscal presente no PDF — ver DOC_VALIDATION_CROSS_CHECK_PROMPT.
// "declaredName"/"declaredDocument" e "invoiceName"/"invoiceDocument" espelham o par
// declarado-vs-encontrado já usado em DocValidationSenderComparison — sempre sobrescritos em
// processDocValidationJob.ts a partir de declaredData/extraction (nunca confiados direto na
// resposta da IA), para garantir que documentos saiam sempre com máscara.
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

export interface DocValidationSenderComparison {
  declaredName: string;
  declaredDocument: string;
  invoiceName: string | null;
  invoiceDocument: string | null;
  documentMatch: boolean;
  nameSimilarityPercent: number | null;
}

export interface DocValidationPlateComparison {
  declared: string | null;
  invoice: string | null;
  loadingOrder: string | null;
  weighingTicket: string | null;
  confidencePercent: number;
}

// Formato uniforme de comparação campo a campo usado por todo dado declarado que NÃO seja placa,
// contrato ou remetente/destinatário da NF (esses três continuam com formato próprio acima —
// placa e remetente/destinatário porque a comparação já é feita como parte da identificação da
// nota correta, contrato porque uma divergência já gera bloqueio via doc_validation_issues, ver
// processDocValidationJob.ts). "value" é sempre o valor CORRETO (extraído do documento fonte de
// maior prioridade disponível) — é o que o cliente deve usar para atualizar o cadastro dele
// quando "needsUpdate" for true. "message" só é preenchido (não-null) quando precisa alertar
// algo, ou seja, quando "needsUpdate" é true; do contrário fica null.
export interface DocValidationFieldCheck {
  value: string | number | null;
  needsUpdate: boolean;
  message: string | null;
}

// Comparação de invoiceDate/invoiceUnitValue feita por nota fiscal correta individualmente (ver
// matchedInvoice.accessKeys) — diferente de invoiceTotalValue, que é somado entre as notas.
export interface DocValidationInvoiceFieldCheck {
  accessKey: string;
  invoiceDate: DocValidationFieldCheck;
  invoiceUnitValue: DocValidationFieldCheck;
}

// Só a parte de "identidade" da validação cruzada (qual nota é a correta, se placa/contrato/
// remetente batem) fica salva em doc_validation_results.dvrData — os CAMPO-CHECK por campo
// (grossWeightKg, tareWeightKg, netWeightKg, loadingOrder, accessKey, driverName,
// driverDocument, invoices, invoiceTotalValue) não são duplicados aqui: eles vão direto pro
// payload do webhook (ver buildWebhookPayload em processDocValidationJob.ts), porque o
// destinatário real desse diff é o cliente que declarou os dados, não o nosso banco.
export interface DocValidationResult {
  matchedInvoice: DocValidationMatchedInvoice;
  plate: DocValidationPlateComparison;
  contract: DocValidationContractComparison;
  sender: DocValidationSenderComparison;
}

export interface DocValidationExtractedData {
  loadingOrder: DocValidationExtractedDocument<LoadingOrderExtractedFields>;
  invoices: DocValidationExtractedDocument<InvoiceExtractedFields>[];
  weighingTicket: DocValidationExtractedDocument<TicketExtractedFields>;
  cnh: DocValidationExtractedDocument<CnhExtractedFields>;
  validation: DocValidationResult;
}

// Resultado da 1ª chamada ao DeepSeek: só extração/normalização dos documentos do PDF (sem
// declaredData). Não identifica a nota fiscal correta nem faz nenhuma comparação — ver
// DocValidationCrossCheckResult.
export interface DocValidationExtractionResult {
  loadingOrder: DocValidationExtractedDocument<LoadingOrderExtractedFields>;
  invoices: DocValidationExtractedDocument<InvoiceExtractedFields>[];
  weighingTicket: DocValidationExtractedDocument<TicketExtractedFields>;
  cnh: DocValidationExtractedDocument<CnhExtractedFields>;
}

// Resultado da 2ª chamada ao DeepSeek: recebe declaredData + o resultado da 1ª chamada e faz,
// nessa ordem, toda comparação que depende de declaredData — identificação da nota fiscal
// correta (matchedInvoice) e as comparações cruzadas de placa e peso.
export interface DocValidationCrossCheckResult {
  matchedInvoice: DocValidationMatchedInvoice;
  plate: DocValidationPlateComparison;
  contract: DocValidationContractComparison;
  sender: DocValidationSenderComparison;
  grossWeightKg: DocValidationFieldCheck;
  tareWeightKg: DocValidationFieldCheck;
  netWeightKg: DocValidationFieldCheck;
  loadingOrder: DocValidationFieldCheck;
  accessKey: DocValidationFieldCheck;
  driverName: DocValidationFieldCheck;
  driverDocument: DocValidationFieldCheck;
  invoices: DocValidationInvoiceFieldCheck[];
  invoiceTotalValue: DocValidationFieldCheck;
}
