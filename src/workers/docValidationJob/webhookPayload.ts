import {
  DeclaredDocumentData,
  DocValidationExtractionResult,
  DocValidationMatchedInvoice,
  InvoiceExtractedFields,
} from "../../modules/docValidation/types";

type PresentInvoice = { present: true; extraFields: Record<string, unknown> } &
  InvoiceExtractedFields;

function isPresentInvoice(
  invoice: DocValidationExtractionResult["invoices"][number],
): invoice is PresentInvoice {
  return invoice.present;
}

// Nota fiscal usada como fallback pros campos escalares (grossWeightKg, netWeightKg,
// driverName, driverDocument) quando a fonte prioritária não traz o dado: a nota casada
// (matchedInvoice), ou a primeira presente se nenhuma bateu.
function pickFallbackInvoice(
  invoices: DocValidationExtractionResult["invoices"],
  matchedInvoice: DocValidationMatchedInvoice,
): PresentInvoice | null {
  const present = invoices.filter(isPresentInvoice);
  if (!present.length) return null;

  const matchedAccessKey = matchedInvoice.accessKeys[0];
  return (
    present.find((invoice) => invoice.accessKey === matchedAccessKey) ??
    present[0]
  );
}

// Monta o conteúdo de "data" do payload (só usado quando não há nenhuma mensagem bloqueante —
// ver blockingMessages em processDocValidationJob), reconstruindo o formato de input antigo
// (ver DeclaredDataSchema antes da simplificação em
// 019_simplify_doc_validation_declared_data.sql) que o webhook consumidor ainda espera.
// contract/plate/invoiceRecipientName/invoiceRecipientDocument vêm direto do que o cliente
// declarou na rota (ainda são enviados); o resto vem da extração dos documentos do PDF, com a
// fonte de maior confiança escolhida por campo: peso aferido no Ticket > Nota Fiscal > previsto
// na Ordem de Carregamento (peso); Ordem de Carregamento > Nota Fiscal > Ticket (dados do
// motorista). accessKey/invoiceDate/invoiceUnitValue/invoiceTotalValue/invoiceSenderName/
// invoiceSenderDocument (= issuerName/issuerDocument extraídos) voltam em "invoices", um item
// por nota fiscal presente no PDF, já que pode haver mais de uma.
export function buildWebhookPayload(
  extraction: DocValidationExtractionResult,
  declaredData: DeclaredDocumentData,
  matchedInvoice: DocValidationMatchedInvoice,
): Record<string, unknown> {
  const { loadingOrder, weighingTicket, invoices } = extraction;
  const fallbackInvoice = pickFallbackInvoice(invoices, matchedInvoice);

  const grossWeightKg =
    (weighingTicket.present ? weighingTicket.grossWeightKg : null) ??
    fallbackInvoice?.grossWeightKg ??
    null;

  const tareWeightKg = weighingTicket.present
    ? weighingTicket.tareWeightKg
    : null;

  const netWeightKg =
    (weighingTicket.present ? weighingTicket.netWeightKg : null) ??
    fallbackInvoice?.netWeightKg ??
    (loadingOrder.present ? loadingOrder.netWeightKg : null) ??
    null;

  const driverName =
    (loadingOrder.present ? loadingOrder.driverName : null) ??
    fallbackInvoice?.driverName ??
    (weighingTicket.present ? weighingTicket.driverName : null) ??
    null;

  const driverDocument =
    (loadingOrder.present ? loadingOrder.driverDocument : null) ??
    fallbackInvoice?.driverDocument ??
    (weighingTicket.present ? weighingTicket.driverDocument : null) ??
    null;

  return {
    contract: declaredData.contract,
    plate: declaredData.plate,
    invoiceRecipientName: declaredData.invoiceRecipientName,
    invoiceRecipientDocument: declaredData.invoiceRecipientDocument,
    grossWeightKg,
    tareWeightKg,
    netWeightKg,
    loadingOrder: loadingOrder.present ? loadingOrder.loadingOrder : null,
    driverName,
    driverDocument,
    driverPhone: loadingOrder.present ? loadingOrder.driverPhone : null,
    invoices: invoices.filter(isPresentInvoice).map((invoice) => ({
      accessKey: invoice.accessKey,
      invoiceDate: invoice.invoiceDate,
      invoiceUnitValue: invoice.invoiceUnitValue,
      invoiceTotalValue: invoice.invoiceTotalValue,
      invoiceSenderName: invoice.issuerName,
      invoiceSenderDocument: invoice.issuerDocument,
    })),
  };
}
