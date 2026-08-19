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
