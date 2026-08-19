import { pool } from "../pool";
import { generateSnowflakeId } from "../utils/snowflakeId";

export interface DocValidationIssue {
  dviCode: string;
  dvaCode: string;
  dviType: string;
  dviMessage: string;
  dviData: string;
  dviCreatedAt: string;
}

export async function createDocValidationIssue(
  dvaCode: string,
  type: string,
  message: string,
  data: Record<string, unknown>
): Promise<void> {
  const dviCode = generateSnowflakeId();

  await pool.query(
    `INSERT INTO doc_validation_issues (dviCode, dvaCode, dviType, dviMessage, dviData)
     VALUES (?, ?, ?, ?, ?)`,
    [dviCode, dvaCode, type, message, JSON.stringify(data)]
  );
}
