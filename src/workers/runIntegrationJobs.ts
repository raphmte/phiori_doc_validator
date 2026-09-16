import { PoolConnection } from "mariadb";
import { pool } from "../database/pool";
import {
  DocValidationIntegration,
  getIntegrationsToExecute,
  markIntegrationsAsProcessing,
} from "../database/repositories/docValidationIntegrationRepository";
import { processIntegrationJob } from "./processIntegrationJob";

async function claimIntegrationJobs(): Promise<DocValidationIntegration[]> {
  let conn: PoolConnection | undefined;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const jobs = await getIntegrationsToExecute(conn);

    if (jobs.length) {
      await markIntegrationsAsProcessing(
        conn,
        jobs.map((job) => job.dinCode)
      );
    }

    await conn.commit();

    return jobs;
  } catch (e) {
    if (conn) await conn.rollback();
    console.error("Falha ao buscar doc_validation_integrations pendentes:", e);
    return [];
  } finally {
    if (conn) conn.release();
  }
}

export async function runIntegrationJobs(): Promise<void> {
  const jobs = await claimIntegrationJobs();

  for (const job of jobs) {
    await processIntegrationJob(job);
  }
}
