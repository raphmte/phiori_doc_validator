import { FastifyReply, FastifyRequest } from "fastify";
import { deleteWebhookService } from "../services/deleteWebhookService";

interface DeleteWebhookParams {
  webType: string;
}

export async function deleteWebhookController(
  request: FastifyRequest<{ Params: DeleteWebhookParams }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const deleted = await deleteWebhookService(request.params.webType, request.claCode);

  if (!deleted) {
    return reply.code(404).send({ error: "Webhook não encontrado" });
  }

  return reply.code(204).send();
}
