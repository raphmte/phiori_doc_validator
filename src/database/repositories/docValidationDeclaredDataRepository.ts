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
      (dvaCode, dvdContract, dvdPlate, dvdInvoiceRecipientName, dvdInvoiceRecipientDocument)
     VALUES (?, ?, ?, ?, ?)`,
    [dvaCode, data.contract, data.plate, data.invoiceRecipientName, data.invoiceRecipientDocument]
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
    contract: row.dvdContract,
    plate: row.dvdPlate,
    invoiceRecipientName: row.dvdInvoiceRecipientName,
    invoiceRecipientDocument: row.dvdInvoiceRecipientDocument,
  };
}
