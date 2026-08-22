import multipart from "@fastify/multipart";
import Fastify from "fastify";
import docValidationRoutes from "./modules/docValidation/routes";
import webhookRoutes from "./modules/webhook/routes";
import classifierAuthPlugin from "./plugins/classifierAuth";
import { startWorker } from "./workers/runWorker";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ status: "ok" }));

app.register(multipart);
app.register(classifierAuthPlugin);
app.register(webhookRoutes);
app.register(docValidationRoutes);

const PORT = Number(process.env.PORT) || 3000;

app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

startWorker();
