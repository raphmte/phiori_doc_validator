import {
  DeclaredDocumentData,
  DocValidationExtractionResult,
  DocValidationMatchedInvoice,
  InvoiceExtractedFields,
  TicketExtractedFields,
} from "../../modules/docValidation/types";
import {
  maskCpfCnpj,
  maskPhone,
  toIsoDate,
} from "../../modules/docValidation/normalizeDocument";

type PresentInvoice = { present: true; extraFields: Record<string, unknown> } &
  InvoiceExtractedFields;

type PresentTicket = { present: true; extraFields: Record<string, unknown> } &
  TicketExtractedFields;

function isPresentInvoice(
  invoice: DocValidationExtractionResult["invoices"][number],
): invoice is PresentInvoice {
  return invoice.present;
}

function isPresentTicket(
  ticket: DocValidationExtractionResult["weighingTickets"][number],
): ticket is PresentTicket {
  return ticket.present;
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

// Ticket de balança usado como fallback pro tareWeightKg total e pros campos escalares
// (driverName, driverDocument) quando há mais de um no PDF: não existe um "ticket certo" pra
// escolher (sem dado declarado pra comparar, ao contrário da nota fiscal), então usa sempre o
// primeiro presente. Diferente de gross/netWeightKg, a tara NUNCA soma entre tickets — é o peso
// vazio do mesmo caminhão, então somar contaria o mesmo caminhão mais de uma vez.
function pickFallbackTicket(
  weighingTickets: DocValidationExtractionResult["weighingTickets"],
): PresentTicket | null {
  const present = weighingTickets.filter(isPresentTicket);
  return present[0] ?? null;
}

// gross/netWeightKg SOMAM entre todos os tickets presentes (cada ticket pesa uma parte
// diferente da carga), ao contrário da tara (ver pickFallbackTicket). null quando nenhum ticket
// presente tem o campo preenchido, para cair no fallback da nota fiscal/ordem de carregamento.
function sumPresentTicketWeight(
  tickets: PresentTicket[],
  field: "grossWeightKg" | "netWeightKg",
): number | null {
  const values = tickets
    .map((ticket) => ticket[field])
    .filter((weight): weight is number => weight !== null);

  if (!values.length) return null;

  return values.reduce((sum, weight) => sum + weight, 0);
}

// Monta o conteúdo de "data" do payload (só usado quando não há nenhuma mensagem bloqueante —
// ver blockingMessages em processDocValidationJob), reconstruindo o formato de input antigo
// (ver DeclaredDataSchema antes da simplificação em
// 019_simplify_doc_validation_declared_data.sql) que o webhook consumidor ainda espera.
// contract/plate/invoiceRecipientName/invoiceRecipientDocument vêm direto do que o cliente
// declarou na rota (ainda são enviados); o resto vem da extração dos documentos do PDF, com a
// fonte de maior confiança escolhida por campo: Ordem de Carregamento > Nota Fiscal > Ticket
// (dados do motorista). accessKey/invoiceDate/invoiceUnitValue/invoiceTotalValue/
// invoiceSenderName/invoiceSenderDocument (= issuerName/issuerDocument extraídos) voltam em
// "invoices", um item por nota fiscal presente no PDF, já que pode haver mais de uma. Da mesma
// forma, ticketNumber/grossWeightKg/tareWeightKg/netWeightKg de cada Ticket de Balança voltam em
// "weighingTickets", um item por ticket presente no PDF. Além disso, grossWeightKg/netWeightKg
// no topo do payload são a SOMA de todos os tickets presentes (cada um pesa uma parte da carga),
// enquanto tareWeightKg no topo usa só o primeiro ticket (mesmo caminhão em todos, não soma —
// ver pickFallbackTicket/sumPresentTicketWeight).
export function buildWebhookPayload(
  extraction: DocValidationExtractionResult,
  declaredData: DeclaredDocumentData,
  matchedInvoice: DocValidationMatchedInvoice,
): Record<string, unknown> {
  const { loadingOrder, weighingTickets, invoices } = extraction;
  const fallbackInvoice = pickFallbackInvoice(invoices, matchedInvoice);
  const fallbackTicket = pickFallbackTicket(weighingTickets);
  const presentTickets = weighingTickets.filter(isPresentTicket);

  const grossWeightKg =
    sumPresentTicketWeight(presentTickets, "grossWeightKg") ??
    fallbackInvoice?.grossWeightKg ??
    null;

  const tareWeightKg = fallbackTicket?.tareWeightKg ?? null;

  const netWeightKg =
    sumPresentTicketWeight(presentTickets, "netWeightKg") ??
    fallbackInvoice?.netWeightKg ??
    (loadingOrder.present ? loadingOrder.netWeightKg : null) ??
    null;

  const driverName =
    (loadingOrder.present ? loadingOrder.driverName : null) ??
    fallbackInvoice?.driverName ??
    fallbackTicket?.driverName ??
    null;

  const driverDocument =
    (loadingOrder.present ? loadingOrder.driverDocument : null) ??
    fallbackInvoice?.driverDocument ??
    fallbackTicket?.driverDocument ??
    null;

  const driverPhone = loadingOrder.present ? loadingOrder.driverPhone : null;

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
    driverDocument: driverDocument !== null ? maskCpfCnpj(driverDocument) : null,
    driverPhone: driverPhone !== null ? maskPhone(driverPhone) : null,
    invoices: invoices.filter(isPresentInvoice).map((invoice) => ({
      accessKey: invoice.accessKey,
      invoiceDate: invoice.invoiceDate !== null ? toIsoDate(invoice.invoiceDate) : null,
      invoiceUnitValue: invoice.invoiceUnitValue,
      invoiceTotalValue: invoice.invoiceTotalValue,
      invoiceSenderName: invoice.issuerName,
      invoiceSenderDocument:
        invoice.issuerDocument !== null ? maskCpfCnpj(invoice.issuerDocument) : null,
    })),
    weighingTickets: presentTickets.map((ticket) => ({
      ticketNumber: ticket.ticketNumber,
      grossWeightKg: ticket.grossWeightKg,
      tareWeightKg: ticket.tareWeightKg,
      netWeightKg: ticket.netWeightKg,
    })),
  };
}
