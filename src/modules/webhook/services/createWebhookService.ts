import {
  createWebhook,
  Webhook,
} from "../../../database/repositories/webhookRepository";
import { webTypes } from "../webTypes";

export interface CreateWebhookInput {
  claCode: string;
  webUrl: string;
  webType: string;
  webMethod: string;
  webHeaders?: Record<string, string>;
  webFields?: Record<string, string>;
}

export async function createWebhookService(
  input: CreateWebhookInput
): Promise<Webhook> {
  try {
    new URL(input.webUrl);
  } catch {
    throw new Error("webUrl inválida");
  }

  if (!webTypes.includes(input.webType as (typeof webTypes)[number])) {
    throw new Error(`webType deve ser um de: ${webTypes.join(", ")}`);
  }

  return createWebhook({
    claCode: input.claCode,
    webUrl: input.webUrl,
    webType: input.webType,
    webMethod: input.webMethod,
    webHeaders: input.webHeaders ? JSON.stringify(input.webHeaders) : undefined,
    webFields: input.webFields ? JSON.stringify(input.webFields) : undefined,
  });
}
