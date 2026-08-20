import { PoolConnection } from "mariadb";
import { DocValidationResult } from "../../modules/docValidation/types";

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
