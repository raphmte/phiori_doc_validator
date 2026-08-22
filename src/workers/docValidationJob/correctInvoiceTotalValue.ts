import {
  DocValidationExtractedDocument,
  InvoiceExtractedFields,
} from "../../modules/docValidation/types";

// Corrige invoiceTotalValue calculando netWeightKg × invoiceUnitValue: a leitura direta desse
// campo é sujeita a erro, principalmente em notas preenchidas manualmente. Isso fica em código
// (não no prompt de extração) porque o modelo usado não tem modo "thinking" (ver comentário em
// processDocValidationJob.ts) e não faz essa conta de forma confiável mesmo quando instruído a
// calcular — em teste real, extraiu invoiceTotalValue 32022.4 para netWeightKg 38580 e
// invoiceUnitValue 0.83, quando o correto (38580 × 0.83) é 32021.4.
//
// Só corrige quando o valor calculado é PLAUSÍVEL perto do lido (entre metade e o dobro):
// divergência maior costuma ser sinal de invoiceUnitValue estar numa base diferente de
// netWeightKg (ex.: preço por TONELADA em vez de KG — invoiceUnitValue nunca é convertido, ver
// DOC_VALIDATION_EXTRACTION_PROMPT), não um erro de digitação isolado, e nesse caso a conta não
// é confiável.
const PLAUSIBILITY_RATIO_MIN = 0.5;
const PLAUSIBILITY_RATIO_MAX = 2;

export function correctInvoiceTotalValues(
  invoices: DocValidationExtractedDocument<InvoiceExtractedFields>[],
): DocValidationExtractedDocument<InvoiceExtractedFields>[] {
  return invoices.map((invoice) => {
    if (!invoice.present) return invoice;
    if (invoice.netWeightKg === null || invoice.invoiceUnitValue === null) return invoice;

    const computedTotal = Math.round(invoice.netWeightKg * invoice.invoiceUnitValue * 100) / 100;

    if (invoice.invoiceTotalValue !== null && invoice.invoiceTotalValue !== 0) {
      if (invoice.invoiceTotalValue === computedTotal) return invoice;

      const ratio = computedTotal / invoice.invoiceTotalValue;
      if (ratio < PLAUSIBILITY_RATIO_MIN || ratio > PLAUSIBILITY_RATIO_MAX) return invoice;
    }

    return { ...invoice, invoiceTotalValue: computedTotal };
  });
}
