import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { findClassifierByToken } from "../database/repositories/classifierRepository";

declare module "fastify" {
  interface FastifyRequest {
    claCode: string;
  }
}

const classifierAuthPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest("claCode", "");

  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const token = request.headers["x-api-key"];

      if (!token || typeof token !== "string") {
        return reply.code(401).send({ error: "Token não informado" });
      }

      const classifier = await findClassifierByToken(token);

      if (!classifier) {
        return reply.code(401).send({ error: "Token inválido" });
      }

      request.claCode = classifier.claCode;
    }
  );
};

export default fp(classifierAuthPlugin);
