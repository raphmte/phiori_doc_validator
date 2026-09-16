import {
  DocValidationIntegration,
  markIntegrationAsDone,
  markIntegrationAsFailed,
} from "../database/repositories/docValidationIntegrationRepository";
import { getIntegrationSender } from "../modules/integrations/integrationDispatcher";

export async function processIntegrationJob(
  job: DocValidationIntegration
): Promise<void> {
  try {
    const send = getIntegrationSender(job.dinSystem);

    await send(job.dvaCode);

    await markIntegrationAsDone(job.dinCode);
  } catch (e: any) {
    console.error(
      `Integration job ${job.dinCode} (dvaCode ${job.dvaCode}, sistema ${job.dinSystem}) falhou:`,
      e
    );

    await markIntegrationAsFailed(
      job.dinCode,
      job.dinAttempts,
      e?.message ?? "Erro desconhecido"
    );
  }
}
