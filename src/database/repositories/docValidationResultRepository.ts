import { PoolConnection } from "mariadb";
import { DocValidationResult } from "../../modules/docValidation/types";

export async function saveDocValidationResult(
  conn: PoolConnection,
  dvaCode: string,
  validation: DocValidationResult,
  weightsMatch: boolean
): Promise<void> {
  await conn.query(
    `INSERT INTO doc_validation_results
      (dvaCode, dvrPlateConfidencePercent, dvrWeightsMatch, dvrData)
     VALUES (?, ?, ?, ?)`,
    [dvaCode, validation.plate.confidencePercent, weightsMatch, JSON.stringify(validation)]
  );

  const accessKeys = validation.matchedInvoice.accessKeys;
  if (accessKeys.length) {
    const placeholders = accessKeys.map(() => "(?, ?)").join(", ");
    const values = accessKeys.flatMap((accessKey) => [dvaCode, accessKey]);

    await conn.query(
      `INSERT INTO doc_validation_matched_invoices (dvaCode, dmiAccessKey) VALUES ${placeholders}`,
      values
    );
  }
}
