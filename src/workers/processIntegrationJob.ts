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

    // job veio de um SELECT feito ANTES de markIntegrationsAsProcessing incrementar dinAttempts
    // (ver claimIntegrationJobs), então job.dinAttempts ainda não conta a tentativa que acabou de
    // falhar. Sem o +1, a última tentativa chegava aqui como 2, o status voltava para "A" e a
    // linha ficava parada para sempre: dinAttempts já é 3 no banco, o filtro de
    // getIntegrationsToExecute (dinAttempts < 3) nunca mais a pega, e ela nunca virava "E".
    await markIntegrationAsFailed(
      job.dinCode,
      job.dinAttempts + 1,
      e?.message ?? "Erro desconhecido"
    );
  }
}
