import { FastifyReply, FastifyRequest } from "fastify";
import { createWebhookService } from "../services/createWebhookService";

interface CreateWebhookBody {
  webUrl: string;
  webType: string;
  webMethod: string;
  webHeaders?: Record<string, string>;
  webFields?: Record<string, string>;
}

export async function createWebhookController(
  request: FastifyRequest<{ Body: CreateWebhookBody }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const { webUrl, webType, webMethod, webHeaders, webFields } = request.body;

  if (!webUrl || !webType || !webMethod) {
    return reply
      .code(400)
      .send({ error: "webUrl, webType e webMethod são obrigatórios" });
  }

  const webhook = await createWebhookService({
    claCode: request.claCode,
    webUrl,
    webType,
    webMethod,
    webHeaders,
    webFields,
  });

  return reply.code(201).send(webhook);
}
