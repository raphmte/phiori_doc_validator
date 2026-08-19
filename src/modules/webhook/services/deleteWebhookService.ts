import { deleteWebhook } from "../../../database/repositories/webhookRepository";

export async function deleteWebhookService(
  webType: string,
  claCode: string
): Promise<boolean> {
  return deleteWebhook(webType, claCode);
}
