import { FastifyReply, FastifyRequest } from "fastify";
import { TParsedFile } from "../../../plugins/multipart";
import { declaredDataSchema } from "../declaredDataSchema";
import { createDocValidationService } from "../services/createDocValidationService";

function isPdf(file: TParsedFile): boolean {
  return file.mimetype === "application/pdf";
}

export async function createDocValidationController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const { fields, files } = request.parsedMultipart;

  const document = files.bulk?.[0];
  const loadingOrder = files.loadingOrder?.[0];
  const weighingTickets = files.weighingTicket ?? [];
  const invoices = files.invoices ?? [];

  const isBulk = !!document;
  const isSplit = !!loadingOrder || weighingTickets.length > 0 || invoices.length > 0;

  if (isBulk && isSplit) {
    return reply.code(400).send({
      error:
        "Envie o documento único (document) ou os arquivos separados (loadingOrder, weighingTicket, invoices), não os dois",
    });
  }

  if (!isBulk && !isSplit) {
    return reply.code(400).send({ error: "Documento não informado" });
  }

  if (isBulk) {
    if (!isPdf(document)) {
      return reply.code(400).send({ error: "Documento deve ser um PDF" });
    }
  } else {
    if (!loadingOrder) {
      return reply
        .code(400)
        .send({ error: "Arquivo da ordem de carregamento não informado" });
    }
    if (!weighingTickets.length) {
      return reply
        .code(400)
        .send({ error: "Arquivo(s) de ticket de balança não informado(s)" });
    }
    if (!invoices.length) {
      return reply
        .code(400)
        .send({ error: "Arquivo(s) de nota fiscal não informado(s)" });
    }
    if (![loadingOrder, ...weighingTickets, ...invoices].every(isPdf)) {
      return reply.code(400).send({ error: "Todos os arquivos devem ser PDF" });
    }
  }

  const parsed = declaredDataSchema.safeParse(fields);

  if (!parsed.success) {
    return reply.code(400).send({
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
    });
  }

  const result = await createDocValidationService({
    claCode: request.claCode,
    declaredData: parsed.data,
    ...(isBulk
      ? { document: document! }
      : {
          loadingOrder: loadingOrder!,
          weighingTickets,
          invoices,
        }),
  });

  return reply.code(202).send(result);
}
