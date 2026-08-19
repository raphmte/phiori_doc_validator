import { PoolConnection } from "mariadb";
import { pool } from "../pool";
import { generateSnowflakeId } from "../utils/snowflakeId";

export type DocValidationFileType = "loadingOrder" | "weighingTicket" | "invoice";

export interface DocValidationFile {
  dvfCode: string;
  dvaCode: string;
  dvfType: DocValidationFileType;
  dvfFileKey: string;
  dvfFileUrl: string;
  dvfFileName: string;
  dvfFileMimetype: string;
  dvfFileSize: number;
  dvfCreatedAt: string;
}

export interface CreateDocValidationFileInput {
  dvfType: DocValidationFileType;
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileMimetype: string;
  fileSize: number;
}

export async function createDocValidationFiles(
  conn: PoolConnection,
  dvaCode: string,
  files: CreateDocValidationFileInput[],
): Promise<void> {
  if (!files.length) return;

  const values: unknown[] = [];
  const placeholders = files
    .map((file) => {
      values.push(
        generateSnowflakeId(),
        dvaCode,
        file.dvfType,
        file.fileKey,
        file.fileUrl,
        file.fileName,
        file.fileMimetype,
        file.fileSize,
      );
      return "(?, ?, ?, ?, ?, ?, ?, ?)";
    })
    .join(", ");

  await conn.query(
    `INSERT INTO doc_validation_files
      (dvfCode, dvaCode, dvfType, dvfFileKey, dvfFileUrl, dvfFileName, dvfFileMimetype, dvfFileSize)
     VALUES ${placeholders}`,
    values,
  );
}

export async function findFilesByDvaCode(dvaCode: string): Promise<DocValidationFile[]> {
  return pool.query(
    "SELECT * FROM doc_validation_files WHERE dvaCode = ? ORDER BY dvfCode",
    [dvaCode],
  );
}
