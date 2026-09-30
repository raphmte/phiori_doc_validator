import { PoolConnection } from "mariadb";
import { DocValidationResult } from "../../modules/docValidation/types";
import { pool } from "../pool";

export async function saveDocValidationResult(
  conn: PoolConnection,
  dvaCode: string,
  validation: DocValidationResult
): Promise<void> {
  await conn.query(
    `INSERT INTO doc_validation_results
      (dvaCode, dvrPlateConfidencePercent, dvrData)
     VALUES (?, ?, ?)`,
    [dvaCode, validation.plate.confidencePercent, JSON.stringify(validation)]
  );
}

// dvrData é a validação inteira serializada (matchedInvoice, plate, contract). Dependendo da
// versão do driver a coluna JSON chega já parseada ou como string — os dois casos são aceitos.
export async function findDocValidationResultByDvaCode(
  dvaCode: string
): Promise<DocValidationResult | null> {
  const rows = await pool.query(
    "SELECT dvrData FROM doc_validation_results WHERE dvaCode = ?",
    [dvaCode]
  );

  const row = rows[0];
  if (!row) return null;

  return typeof row.dvrData === "string" ? JSON.parse(row.dvrData) : row.dvrData;
}
