import { PoolConnection } from "mariadb";
import { pool } from "../database/pool";
import {
  DocValidation,
  getDocValidationsToExecute,
  markDocValidationsAsProcessing,
} from "../database/repositories/docValidationRepository";
import { processDocValidationJob } from "./processDocValidationJob";

async function claimDocValidationJobs(): Promise<DocValidation[]> {
  let conn: PoolConnection | undefined;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const jobs = await getDocValidationsToExecute(conn);

    if (jobs.length) {
      await markDocValidationsAsProcessing(
        conn,
        jobs.map((job) => job.dvaCode)
      );
    }

    await conn.commit();

    return jobs;
  } catch (e) {
    if (conn) await conn.rollback();
    console.error("Falha ao buscar doc_validations pendentes:", e);
    return [];
  } finally {
    if (conn) conn.release();
  }
}

export async function runDocValidationJobs(): Promise<void> {
  const jobs = await claimDocValidationJobs();

  for (const job of jobs) {
    await processDocValidationJob(job);
  }
}
