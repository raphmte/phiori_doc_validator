import { FastifyReply, FastifyRequest } from "fastify";
import { updateWebhookService } from "../services/updateWebhookService";

interface UpdateWebhookBody {
  webUrl?: string;
  webMethod?: string;
  webHeaders?: Record<string, string>;
  webFields?: Record<string, string>;
}

interface UpdateWebhookParams {
  webType: string;
}

export async function updateWebhookController(
  request: FastifyRequest<{ Params: UpdateWebhookParams; Body: UpdateWebhookBody }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const webhook = await updateWebhookService(
    request.params.webType,
    request.claCode,
    request.body
  );

  if (!webhook) {
    return reply.code(404).send({ error: "Webhook não encontrado" });
  }

  return reply.send(webhook);
}
