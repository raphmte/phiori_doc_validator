import { MultipartFile } from "@fastify/multipart";
import { FastifyRequest } from "fastify";

export type TParsedFile = Pick<
  MultipartFile,
  "fieldname" | "filename" | "encoding" | "mimetype"
> & {
  buffer: Buffer;
  truncated: boolean;
};

declare module "fastify" {
  interface FastifyRequest {
    parsedMultipart: {
      fields: Record<string, any>;
      // Sempre array por fieldname (mesmo quando só 1 arquivo é esperado) para suportar campos
      // com múltiplos arquivos, como "invoices" no createDocValidationController.
      files: Record<string, TParsedFile[]>;
    };
  }
}

export const parseMultipartPreHandler = async (request: FastifyRequest) => {
  const contentType = request.headers["content-type"];
  if (!contentType?.includes("multipart/form-data")) {
    return;
  }

  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  const parts = request.parts({ limits: { fileSize: MAX_FILE_SIZE } });
  const files: Record<string, TParsedFile[]> = {};
  const fields: Record<string, any> = {};

  for await (const part of parts) {
    if (part.type === "file") {
      const buffer = await part.toBuffer();
      const truncated = part.file.truncated;
      const parsedFile: TParsedFile = {
        fieldname: part.fieldname,
        filename: part.filename,
        encoding: part.encoding,
        mimetype: part.mimetype,
        buffer,
        truncated,
      };
      files[part.fieldname] = [...(files[part.fieldname] ?? []), parsedFile];
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  request.parsedMultipart = {
    fields,
    files,
  };
};
