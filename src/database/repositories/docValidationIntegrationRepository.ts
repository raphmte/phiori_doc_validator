import { PoolConnection } from "mariadb";
import { pool } from "../pool";
import { generateSnowflakeId } from "../utils/snowflakeId";

export const MAX_INTEGRATION_ATTEMPTS = 3;
const RETRY_DELAY_SECONDS = 10;

export interface DocValidationIntegration {
  dinCode: string;
  dinStatus: "A" | "P" | "D" | "E";
  dvaCode: string;
  dinSystem: string;
  dinAttempts: number;
  dinLastError: string | null;
  dinLastProcessStartedAt: string | null;
  dinCreatedAt: string;
  dinUpdatedAt: string;
}

export interface CreateDocValidationIntegrationInput {
  dvaCode: string;
  system: string;
}

export async function createDocValidationIntegration(
  input: CreateDocValidationIntegrationInput
): Promise<void> {
  const dinCode = generateSnowflakeId();

  await pool.query(
    `INSERT INTO doc_validation_integrations (dinCode, dvaCode, dinSystem) VALUES (?, ?, ?)`,
    [dinCode, input.dvaCode, input.system]
  );
}

export async function getIntegrationsToExecute(
  conn: PoolConnection
): Promise<DocValidationIntegration[]> {
  return conn.query(
    `SELECT * FROM doc_validation_integrations
     WHERE dinStatus = 'A'
       AND dinAttempts < ${MAX_INTEGRATION_ATTEMPTS}
       AND (dinLastProcessStartedAt IS NULL OR dinLastProcessStartedAt < NOW() - INTERVAL ${RETRY_DELAY_SECONDS} SECOND)
     ORDER BY dinCode
     LIMIT 10
     FOR UPDATE SKIP LOCKED`
  );
}

export async function markIntegrationsAsProcessing(
  conn: PoolConnection,
  dinCodes: string[]
): Promise<void> {
  if (!dinCodes.length) return;

  const placeholders = dinCodes.map(() => "?").join(",");

  await conn.query(
    `UPDATE doc_validation_integrations
     SET dinStatus = 'P', dinAttempts = dinAttempts + 1, dinLastProcessStartedAt = NOW()
     WHERE dinCode IN (${placeholders})`,
    dinCodes
  );
}

export async function markIntegrationAsDone(dinCode: string): Promise<void> {
  await pool.query(
    `UPDATE doc_validation_integrations SET dinStatus = 'D', dinLastError = NULL WHERE dinCode = ?`,
    [dinCode]
  );
}

export async function markIntegrationAsFailed(
  dinCode: string,
  attempts: number,
  errorMessage: string
): Promise<void> {
  const status = attempts < MAX_INTEGRATION_ATTEMPTS ? "A" : "E";

  await pool.query(
    `UPDATE doc_validation_integrations SET dinStatus = ?, dinLastError = ? WHERE dinCode = ?`,
    [status, errorMessage, dinCode]
  );
}
