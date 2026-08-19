import { pool } from "../pool";
import { generateSnowflakeId } from "../utils/snowflakeId";

export interface Classifier {
  claCode: string;
  claName: string;
  claToken: string;
  claCreatedAt: string;
  claUpdatedAt: string;
}

export async function createClassifier(
  claName: string,
  claToken: string
): Promise<Classifier> {
  const claCode = generateSnowflakeId();

  await pool.query(
    "INSERT INTO classifiers (claCode, claName, claToken) VALUES (?, ?, ?)",
    [claCode, claName, claToken]
  );

  return findClassifierByCode(claCode) as Promise<Classifier>;
}

export async function findClassifierByCode(
  claCode: string
): Promise<Classifier | null> {
  const rows = await pool.query(
    "SELECT * FROM classifiers WHERE claCode = ?",
    [claCode]
  );
  return rows[0] ?? null;
}

export async function findClassifierByToken(
  claToken: string
): Promise<Classifier | null> {
  const rows = await pool.query(
    "SELECT * FROM classifiers WHERE claToken = ?",
    [claToken]
  );
  return rows[0] ?? null;
}

export async function listClassifiers(): Promise<Classifier[]> {
  return pool.query("SELECT * FROM classifiers ORDER BY claCreatedAt DESC");
}
