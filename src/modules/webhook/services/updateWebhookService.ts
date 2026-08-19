import {
  updateWebhook,
  Webhook,
} from "../../../database/repositories/webhookRepository";

export interface UpdateWebhookInput {
  webUrl?: string;
  webMethod?: string;
  webHeaders?: Record<string, string>;
  webFields?: Record<string, string>;
}

export async function updateWebhookService(
  webType: string,
  claCode: string,
  input: UpdateWebhookInput
): Promise<Webhook | null> {
  if (input.webUrl) {
    try {
      new URL(input.webUrl);
    } catch {
      throw new Error("webUrl inválida");
    }
  }

  return updateWebhook(webType, claCode, {
    webUrl: input.webUrl,
    webMethod: input.webMethod,
    webHeaders: input.webHeaders ? JSON.stringify(input.webHeaders) : undefined,
    webFields: input.webFields ? JSON.stringify(input.webFields) : undefined,
  });
}
