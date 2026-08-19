import {
  DocValidationExtractedDocument,
  InvoiceExtractedFields,
} from "../../modules/docValidation/types";

export function dedupeInvoicesByAccessKey(
  invoices: DocValidationExtractedDocument<InvoiceExtractedFields>[],
): DocValidationExtractedDocument<InvoiceExtractedFields>[] {
  const seenAccessKeys = new Set<string>();

  return invoices.filter((invoice) => {
    if (!invoice.present || !invoice.accessKey) return true;
    if (seenAccessKeys.has(invoice.accessKey)) return false;
    seenAccessKeys.add(invoice.accessKey);
    return true;
  });
}
