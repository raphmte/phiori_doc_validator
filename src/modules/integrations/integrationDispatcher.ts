import { INTEGRATION_SYSTEMS, IntegrationSystem } from "./integrationTypes";
import { sendToPhiori } from "./providers/sendToPhiori";

type IntegrationSender = (dvaCode: string) => Promise<void>;

const integrationSenders: Record<IntegrationSystem, IntegrationSender> = {
  [INTEGRATION_SYSTEMS.PHIORI]: sendToPhiori,
};

export function getIntegrationSender(system: string): IntegrationSender {
  const sender = integrationSenders[system as IntegrationSystem];

  if (!sender) {
    throw new Error(`Nenhum sender registrado para o sistema de integração "${system}"`);
  }

  return sender;
}
