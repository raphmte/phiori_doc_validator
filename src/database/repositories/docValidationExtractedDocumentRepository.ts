import { PoolConnection } from "mariadb";
import {
  DocValidationExtractedData,
  DocValidationExtractedDocument,
  DocValidationExtractionResult,
  InvoiceExtractedFields,
  LoadingOrderExtractedFields,
  TicketExtractedFields,
} from "../../modules/docValidation/types";
import { pool } from "../pool";

export type DocValidationDocumentType =
  | "loadingOrder"
  | "invoice"
  | "weighingTicket";

type PresentExtractedDocument =
  | Extract<DocValidationExtractedDocument<LoadingOrderExtractedFields>, { present: true }>
  | Extract<DocValidationExtractedDocument<InvoiceExtractedFields>, { present: true }>
  | Extract<DocValidationExtractedDocument<TicketExtractedFields>, { present: true }>;

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

  for (const weighingTicket of result.weighingTickets ?? []) {
    if (weighingTicket.present) {
      rows.push({ type: "weighingTicket", data: weighingTicket });
    }
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

// As colunas JSON chegam já parseadas ou como string, conforme o driver — aceita os dois.
function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  return (typeof value === "string" ? JSON.parse(value) : value) as T;
}

// Reconstrói a extração como ela era ao ser gravada em saveDocValidationExtractedDocuments: um
// documento por linha, na ordem em que foram inseridos (ordem de carregamento, notas, tickets).
// Só existem linhas de documentos PRESENTES — os ausentes nunca são gravados —, então o que não
// aparece volta como { present: false }, o mesmo formato que a extração original devolvia.
export async function findExtractedDocumentsByDvaCode(
  dvaCode: string
): Promise<DocValidationExtractionResult> {
  const rows = await pool.query(
    `SELECT dedType, dedData, dedExtraFields
     FROM doc_validation_extracted_documents
     WHERE dvaCode = ?
     ORDER BY dedCode`,
    [dvaCode]
  );

  const extraction: DocValidationExtractionResult = {
    loadingOrder: { present: false },
    invoices: [],
    weighingTickets: [],
  };

  for (const row of rows as {
    dedType: DocValidationDocumentType;
    dedData: unknown;
    dedExtraFields: unknown;
  }[]) {
    const fields = parseJson<Record<string, unknown>>(row.dedData, {});
    const extraFields = parseJson<Record<string, unknown>>(row.dedExtraFields, {});
    const document = { ...fields, present: true, extraFields };

    if (row.dedType === "loadingOrder") {
      extraction.loadingOrder = document as DocValidationExtractedDocument<LoadingOrderExtractedFields>;
    } else if (row.dedType === "invoice") {
      extraction.invoices.push(document as DocValidationExtractedDocument<InvoiceExtractedFields>);
    } else if (row.dedType === "weighingTicket") {
      extraction.weighingTickets.push(document as DocValidationExtractedDocument<TicketExtractedFields>);
    }
  }

  return extraction;
}
