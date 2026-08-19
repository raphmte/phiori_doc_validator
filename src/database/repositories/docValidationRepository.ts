import { PoolConnection } from "mariadb";
import { pool } from "../pool";
import {
  DeclaredDocumentData,
  DocValidationExtractedData,
} from "../../modules/docValidation/types";
import { TDocumentAIPage } from "../../helpers/GoogleDocumentAIOcr";
import { createDocValidationDeclaredData } from "./docValidationDeclaredDataRepository";
import { saveDocValidationExtractedDocuments } from "./docValidationExtractedDocumentRepository";
import { saveDocValidationResult } from "./docValidationResultRepository";
import {
  createDocValidationFiles,
  CreateDocValidationFileInput,
} from "./docValidationFileRepository";

export const MAX_DOC_VALIDATION_ATTEMPTS = 3;
const RETRY_DELAY_SECONDS = 10;

export interface DocValidation {
  dvaCode: string;
  dvaStatus: "A" | "P" | "D" | "E";
  claCode: string;
  dvaFileKey: string | null;
  dvaFileUrl: string | null;
  dvaFileName: string | null;
  dvaFileMimetype: string | null;
  dvaFileSize: number | null;
  dvaPages: string | null;
  dvaAttempts: number;
  dvaLastError: string | null;
  dvaLastProcessStartedAt: string | null;
  dvaCreatedAt: string;
  dvaUpdatedAt: string;
}

// Bulk: um único PDF com tudo junto (dvaFile* preenchidos, doc_validation_files vazio).
// Split: ordem de carregamento + ticket de balança + N notas enviados como arquivos separados
// (dvaFile* ficam NULL, cada arquivo vira uma linha em doc_validation_files).
export interface CreateDocValidationInput {
  dvaCode: string;
  claCode: string;
  declaredData: DeclaredDocumentData;
  file?: {
    key: string;
    fileUrl: string;
    fileName: string;
    fileMimetype: string;
    fileSize: number;
  };
  files?: CreateDocValidationFileInput[];
}

export async function createDocValidation(
  input: CreateDocValidationInput
): Promise<DocValidation> {
  const { dvaCode } = input;

  let conn: PoolConnection | undefined;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO doc_validations
        (dvaCode, claCode, dvaFileKey, dvaFileUrl, dvaFileName, dvaFileMimetype, dvaFileSize)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dvaCode,
        input.claCode,
        input.file?.key ?? null,
        input.file?.fileUrl ?? null,
        input.file?.fileName ?? null,
        input.file?.fileMimetype ?? null,
        input.file?.fileSize ?? null,
      ]
    );

    if (input.files?.length) {
      await createDocValidationFiles(conn, dvaCode, input.files);
    }

    await createDocValidationDeclaredData(conn, dvaCode, input.declaredData);

    await conn.commit();
  } catch (e) {
    if (conn) await conn.rollback();
    throw e;
  } finally {
    if (conn) conn.release();
  }

  return findDocValidationByCode(dvaCode) as Promise<DocValidation>;
}

export async function findDocValidationByCode(
  dvaCode: string
): Promise<DocValidation | null> {
  const rows = await pool.query(
    "SELECT * FROM doc_validations WHERE dvaCode = ?",
    [dvaCode]
  );
  return rows[0] ?? null;
}

export async function getDocValidationsToExecute(
  conn: PoolConnection
): Promise<DocValidation[]> {
  return conn.query(
    `SELECT * FROM doc_validations
     WHERE dvaStatus = 'A'
       AND dvaAttempts < ${MAX_DOC_VALIDATION_ATTEMPTS}
       AND (dvaLastProcessStartedAt IS NULL OR dvaLastProcessStartedAt < NOW() - INTERVAL ${RETRY_DELAY_SECONDS} SECOND)
     ORDER BY dvaCode
     LIMIT 10
     FOR UPDATE SKIP LOCKED`
  );
}

export async function markDocValidationsAsProcessing(
  conn: PoolConnection,
  dvaCodes: string[]
): Promise<void> {
  if (!dvaCodes.length) return;

  const placeholders = dvaCodes.map(() => "?").join(",");

  await conn.query(
    `UPDATE doc_validations
     SET dvaStatus = 'P', dvaAttempts = dvaAttempts + 1, dvaLastProcessStartedAt = NOW()
     WHERE dvaCode IN (${placeholders})`,
    dvaCodes
  );
}

export async function markDocValidationAsDone(
  dvaCode: string,
  pages: TDocumentAIPage[],
  result: DocValidationExtractedData
): Promise<void> {
  let conn: PoolConnection | undefined;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query(
      `UPDATE doc_validations
       SET dvaStatus = 'D', dvaPages = ?, dvaLastError = NULL
       WHERE dvaCode = ?`,
      [JSON.stringify(pages), dvaCode]
    );

    await saveDocValidationExtractedDocuments(conn, dvaCode, result);
    await saveDocValidationResult(conn, dvaCode, result.validation);

    await conn.commit();
  } catch (e) {
    if (conn) await conn.rollback();
    throw e;
  } finally {
    if (conn) conn.release();
  }
}

export async function markDocValidationAsFailed(
  dvaCode: string,
  attempts: number,
  errorMessage: string
): Promise<void> {
  const status = attempts < MAX_DOC_VALIDATION_ATTEMPTS ? "A" : "E";

  await pool.query(
    `UPDATE doc_validations SET dvaStatus = ?, dvaLastError = ? WHERE dvaCode = ?`,
    [status, errorMessage, dvaCode]
  );
}
