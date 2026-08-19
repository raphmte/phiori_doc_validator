import { PoolConnection } from "mariadb";
import { pool } from "../pool";
import { DeclaredDocumentData } from "../../modules/docValidation/types";

export async function createDocValidationDeclaredData(
  conn: PoolConnection,
  dvaCode: string,
  data: DeclaredDocumentData
): Promise<void> {
  await conn.query(
    `INSERT INTO doc_validation_declared_data
      (dvaCode, dvdPlate, dvdGrossWeightKg, dvdTareWeightKg, dvdNetWeightKg, dvdLoadingOrder,
       dvdContract, dvdAccessKey, dvdDriverName, dvdDriverDocument, dvdDriverPhone,
       dvdInvoiceRecipientName, dvdInvoiceRecipientDocument,
       dvdInvoiceSenderName, dvdInvoiceSenderDocument,
       dvdInvoiceDate, dvdInvoiceUnitValue, dvdInvoiceTotalValue)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dvaCode,
      data.plate,
      data.grossWeightKg,
      data.tareWeightKg,
      data.netWeightKg,
      data.loadingOrder,
      data.contract,
      data.accessKey,
      data.driverName,
      data.driverDocument,
      data.driverPhone,
      data.invoiceRecipientName,
      data.invoiceRecipientDocument,
      data.invoiceSenderName,
      data.invoiceSenderDocument,
      data.invoiceDate,
      data.invoiceUnitValue,
      data.invoiceTotalValue,
    ]
  );
}

export async function findDeclaredDataByDvaCode(
  dvaCode: string
): Promise<DeclaredDocumentData | null> {
  const rows = await pool.query(
    "SELECT * FROM doc_validation_declared_data WHERE dvaCode = ?",
    [dvaCode]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    plate: row.dvdPlate,
    grossWeightKg: row.dvdGrossWeightKg !== null ? Number(row.dvdGrossWeightKg) : null,
    tareWeightKg: row.dvdTareWeightKg !== null ? Number(row.dvdTareWeightKg) : null,
    netWeightKg: row.dvdNetWeightKg !== null ? Number(row.dvdNetWeightKg) : null,
    loadingOrder: row.dvdLoadingOrder !== null ? Number(row.dvdLoadingOrder) : null,
    contract: row.dvdContract,
    accessKey: row.dvdAccessKey,
    driverName: row.dvdDriverName,
    driverDocument: row.dvdDriverDocument,
    driverPhone: row.dvdDriverPhone,
    invoiceRecipientName: row.dvdInvoiceRecipientName,
    invoiceRecipientDocument: row.dvdInvoiceRecipientDocument,
    invoiceSenderName: row.dvdInvoiceSenderName,
    invoiceSenderDocument: row.dvdInvoiceSenderDocument,
    invoiceDate: row.dvdInvoiceDate,
    invoiceUnitValue: row.dvdInvoiceUnitValue !== null ? Number(row.dvdInvoiceUnitValue) : null,
    invoiceTotalValue: row.dvdInvoiceTotalValue !== null ? Number(row.dvdInvoiceTotalValue) : null,
  };
}
