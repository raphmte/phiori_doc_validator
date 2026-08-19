import { pool } from "../pool";
import { generateSnowflakeId } from "../utils/snowflakeId";

export interface Webhook {
  webCode: string;
  webStatus: string;
  claCode: string;
  webUrl: string;
  webType: string;
  webHeaders: string | null;
  webFields: string | null;
  webMethod: string;
  webCreatedAt: string;
  webUpdatedAt: string;
}

export interface CreateWebhookInput {
  claCode: string;
  webUrl: string;
  webType: string;
  webMethod: string;
  webHeaders?: string;
  webFields?: string;
}

export async function createWebhook(
  input: CreateWebhookInput
): Promise<Webhook> {
  const webCode = generateSnowflakeId();

  await pool.query(
    `INSERT INTO webhooks (webCode, claCode, webUrl, webType, webMethod, webHeaders, webFields)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      webCode,
      input.claCode,
      input.webUrl,
      input.webType,
      input.webMethod,
      input.webHeaders ?? null,
      input.webFields ?? null,
    ]
  );

  return findWebhookByCode(webCode) as Promise<Webhook>;
}

export async function findWebhookByCode(
  webCode: string
): Promise<Webhook | null> {
  const rows = await pool.query(
    "SELECT * FROM webhooks WHERE webCode = ? AND webStatus <> 'E'",
    [webCode]
  );
  return rows[0] ?? null;
}

export async function listWebhooksByClassifier(
  claCode: string
): Promise<Webhook[]> {
  return pool.query(
    "SELECT * FROM webhooks WHERE claCode = ? AND webStatus <> 'E' ORDER BY webCreatedAt DESC",
    [claCode]
  );
}

export async function listWebhooks(): Promise<Webhook[]> {
  return pool.query(
    "SELECT * FROM webhooks WHERE webStatus <> 'E' ORDER BY webCreatedAt DESC"
  );
}

export async function findWebhookByType(
  webType: string,
  claCode: string
): Promise<Webhook | null> {
  const rows = await pool.query(
    "SELECT * FROM webhooks WHERE webType = ? AND claCode = ? AND webStatus <> 'E'",
    [webType, claCode]
  );
  return rows[0] ?? null;
}

export interface UpdateWebhookInput {
  webUrl?: string;
  webMethod?: string;
  webHeaders?: string;
  webFields?: string;
}

export async function updateWebhook(
  webType: string,
  claCode: string,
  input: UpdateWebhookInput
): Promise<Webhook | null> {
  const fields = Object.entries(input).filter(([, value]) => value !== undefined);

  if (fields.length === 0) {
    return findWebhookByType(webType, claCode);
  }

  const setClause = fields.map(([field]) => `${field} = ?`).join(", ");
  const values = fields.map(([, value]) => value);

  const result = await pool.query(
    `UPDATE webhooks SET ${setClause} WHERE webType = ? AND claCode = ? AND webStatus <> 'E'`,
    [...values, webType, claCode]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findWebhookByType(webType, claCode);
}

export async function deleteWebhook(
  webType: string,
  claCode: string
): Promise<boolean> {
  const result = await pool.query(
    "UPDATE webhooks SET webStatus = 'E' WHERE webType = ? AND claCode = ? AND webStatus <> 'E'",
    [webType, claCode]
  );

  return result.affectedRows > 0;
}
