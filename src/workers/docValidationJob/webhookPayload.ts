import {
  DocValidationCrossCheckResult,
  DocValidationFieldCheck,
  DocValidationInvoiceFieldCheck,
} from "../../modules/docValidation/types";

// Formata o "value" de um CAMPO-CHECK numérico com casas decimais fixas antes de mandar pro
// webhook — Number() descarta zeros à direita (150.5 em vez de 150.5000), então sem isso o
// cliente não recebe a quantidade de casas decimais padronizada mesmo com o valor certo.
function formatFieldCheckDecimal(
  check: DocValidationFieldCheck,
  decimalPlaces: number
): DocValidationFieldCheck {
  return typeof check.value === "number"
    ? { ...check, value: check.value.toFixed(decimalPlaces) }
    : check;
}

// Só inclui a chave quando needsUpdate for true — o webhook é um diff pro cliente corrigir o
// cadastro dele, então um CAMPO-CHECK que bateu (needsUpdate: false) não tem o que comunicar.
function addFieldCheckIfNeedsUpdate(
  target: Record<string, unknown>,
  key: string,
  check: DocValidationFieldCheck,
  decimalPlaces?: number
): void {
  if (!check.needsUpdate) return;

  target[key] = decimalPlaces !== undefined ? formatFieldCheckDecimal(check, decimalPlaces) : check;
}

// Mesma lógica de diff do addFieldCheckIfNeedsUpdate, mas por nota fiscal: só monta a entrada
// (e só inclui invoiceDate/invoiceUnitValue dentro dela) quando pelo menos um dos dois precisa
// de update — nota que bateu em tudo não tem o que o cliente corrigir, então nem entra no array.
function buildInvoiceFieldChecksNeedingUpdate(
  invoices: DocValidationInvoiceFieldCheck[]
): Record<string, unknown>[] {
  return invoices.reduce<Record<string, unknown>[]>((result, invoice) => {
    const entry: Record<string, unknown> = {};

    addFieldCheckIfNeedsUpdate(entry, "invoiceDate", invoice.invoiceDate);
    addFieldCheckIfNeedsUpdate(entry, "invoiceUnitValue", invoice.invoiceUnitValue, 4);

    if (Object.keys(entry).length === 0) return result;

    result.push({ accessKey: invoice.accessKey, ...entry });
    return result;
  }, []);
}

// Monta o conteúdo de "data" do payload (só usado quando não há nenhuma mensagem bloqueante —
// ver blockingMessages em processDocValidationJob). Diferente de declaredData (que é o cadastro
// que o cliente já tem), "data" é o diff: só entram os campos com CAMPO-CHECK no crossCheck
// (grossWeightKg, tareWeightKg, netWeightKg, loadingOrder, accessKey, driverName, driverDocument,
// invoiceTotalValue e o array de invoiceDate/invoiceUnitValue por nota) cujo needsUpdate seja
// true — cada um como {value, needsUpdate, message}. Campos sem CAMPO-CHECK (plate, contract,
// driverPhone, invoiceRecipient/SenderName/Document) não entram, porque não há como saber se
// precisam de correção; e um campo com CAMPO-CHECK que bateu também não entra, porque o cliente
// não precisa reenviar o que já está certo.
export function buildWebhookPayload(crossCheck: DocValidationCrossCheckResult): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  addFieldCheckIfNeedsUpdate(data, "grossWeightKg", crossCheck.grossWeightKg, 2);
  addFieldCheckIfNeedsUpdate(data, "tareWeightKg", crossCheck.tareWeightKg, 2);
  addFieldCheckIfNeedsUpdate(data, "netWeightKg", crossCheck.netWeightKg, 2);
  addFieldCheckIfNeedsUpdate(data, "loadingOrder", crossCheck.loadingOrder);
  addFieldCheckIfNeedsUpdate(data, "accessKey", crossCheck.accessKey);
  addFieldCheckIfNeedsUpdate(data, "driverName", crossCheck.driverName);
  addFieldCheckIfNeedsUpdate(data, "driverDocument", crossCheck.driverDocument);
  addFieldCheckIfNeedsUpdate(data, "invoiceTotalValue", crossCheck.invoiceTotalValue, 4);

  const invoices = buildInvoiceFieldChecksNeedingUpdate(crossCheck.invoices);
  if (invoices.length > 0) data.invoices = invoices;

  return data;
}
