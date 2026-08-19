import { FastifyInstance } from "fastify";
import { parseMultipartPreHandler } from "../../plugins/multipart";
import { createDocValidationController } from "./controllers/createDocValidationController";

export default async function docValidationRoutes(fastify: FastifyInstance) {
  fastify.post("/doc-validations", {
    preHandler: [parseMultipartPreHandler],
    handler: createDocValidationController,
  });
}
