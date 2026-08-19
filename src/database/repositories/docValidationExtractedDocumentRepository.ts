import { PoolConnection } from "mariadb";
import {
  CnhExtractedFields,
  DocValidationExtractedData,
  DocValidationExtractedDocument,
  InvoiceExtractedFields,
  LoadingOrderExtractedFields,
  TicketExtractedFields,
} from "../../modules/docValidation/types";

export type DocValidationDocumentType =
  | "loadingOrder"
  | "invoice"
  | "weighingTicket"
  | "cnh";

type PresentExtractedDocument =
  | Extract<DocValidationExtractedDocument<LoadingOrderExtractedFields>, { present: true }>
  | Extract<DocValidationExtractedDocument<InvoiceExtractedFields>, { present: true }>
  | Extract<DocValidationExtractedDocument<TicketExtractedFields>, { present: true }>
  | Extract<DocValidationExtractedDocument<CnhExtractedFields>, { present: true }>;

export async function saveDocValidationExtractedDocuments(
  conn: PoolConnection,
  dvaCode: string,
  result: DocValidationExtractedData
): Promise<void> {
  const rows: { type: DocValidationDocumentType; data: PresentExtractedDocument }[] = [];

  if (result.loadingOrder?.present) {
    rows.push({ type: "loadingOrder", data: result.loadingOrder });
  }

  for (const invoice of result.invoices ?? []) {
    if (invoice.present) {
      rows.push({ type: "invoice", data: invoice });
    }
  }

  if (result.weighingTicket?.present) {
    rows.push({ type: "weighingTicket", data: result.weighingTicket });
  }

  if (result.cnh?.present) {
    rows.push({ type: "cnh", data: result.cnh });
  }

  if (!rows.length) return;

  const values: unknown[] = [];
  const placeholders = rows
    .map((row) => {
      const { extraFields, ...fixedFields } = row.data;

      values.push(dvaCode, row.type, JSON.stringify(fixedFields), JSON.stringify(extraFields));
      return "(?, ?, ?, ?)";
    })
    .join(", ");

  await conn.query(
    `INSERT INTO doc_validation_extracted_documents (dvaCode, dedType, dedData, dedExtraFields) VALUES ${placeholders}`,
    values
  );
}
