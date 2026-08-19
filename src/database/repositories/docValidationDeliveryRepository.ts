import { pool } from "../pool";
import { generateSnowflakeId } from "../utils/snowflakeId";

export interface CreateDocValidationDeliveryInput {
  dvaCode: string;
  webCode: string | null;
  url: string | null;
  method: string | null;
  payload: unknown;
  statusCode: number | null;
  responseBody: string | null;
  success: boolean;
  error: string | null;
}

export async function createDocValidationDelivery(
  input: CreateDocValidationDeliveryInput
): Promise<void> {
  const ddvCode = generateSnowflakeId();

  await pool.query(
    `INSERT INTO doc_validation_deliveries
      (ddvCode, dvaCode, webCode, ddvUrl, ddvMethod, ddvPayload, ddvStatusCode, ddvResponseBody, ddvSuccess, ddvError)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ddvCode,
      input.dvaCode,
      input.webCode,
      input.url,
      input.method,
      JSON.stringify(input.payload),
      input.statusCode,
      input.responseBody,
      input.success,
      input.error,
    ]
  );
}
