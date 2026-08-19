import { FastifyInstance } from "fastify";
import { createWebhookController } from "./controllers/createWebhookController";
import { updateWebhookController } from "./controllers/updateWebhookController";
import { deleteWebhookController } from "./controllers/deleteWebhookController";

export default async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post("/webhooks", createWebhookController);
  fastify.put("/webhooks/:webType", updateWebhookController);
  fastify.delete("/webhooks/:webType", deleteWebhookController);
}
