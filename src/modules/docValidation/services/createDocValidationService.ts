import { createDocValidation } from "../../../database/repositories/docValidationRepository";
import { CreateDocValidationFileInput } from "../../../database/repositories/docValidationFileRepository";
import { generateSnowflakeId } from "../../../database/utils/snowflakeId";
import R2StorageHelper from "../../../helpers/R2StorageHelper";
import { TParsedFile } from "../../../plugins/multipart";
import { DeclaredDocumentData } from "../types";

interface BulkInput {
  document: TParsedFile;
}

interface SplitInput {
  loadingOrder: TParsedFile;
  weighingTicket: TParsedFile;
  invoices: TParsedFile[];
}

export type CreateDocValidationInput = {
  claCode: string;
  declaredData: DeclaredDocumentData;
} & (BulkInput | SplitInput);

export interface CreateDocValidationOutput {
  validationId: string;
}

function isBulkInput(
  input: BulkInput | SplitInput,
): input is BulkInput {
  return "document" in input;
}

export async function createDocValidationService(
  input: CreateDocValidationInput,
): Promise<CreateDocValidationOutput> {
  const { claCode, declaredData } = input;

  const dvaCode = generateSnowflakeId();

  if (isBulkInput(input)) {
    const { document } = input;

    const { key, fileUrl } = await R2StorageHelper.uploadDocValidationFile(
      document,
      claCode,
      dvaCode,
    );

    const validation = await createDocValidation({
      dvaCode,
      claCode,
      declaredData,
      file: {
        key,
        fileUrl,
        fileName: document.filename,
        fileMimetype: document.mimetype,
        fileSize: document.buffer.length,
      },
    });

    return { validationId: validation.dvaCode };
  }

  const { loadingOrder, weighingTicket, invoices } = input;

  const uploads: { dvfType: CreateDocValidationFileInput["dvfType"]; file: TParsedFile; suffix: string }[] = [
    { dvfType: "loadingOrder", file: loadingOrder, suffix: "loading-order" },
    { dvfType: "weighingTicket", file: weighingTicket, suffix: "weighing-ticket" },
    ...invoices.map((file, index) => ({
      dvfType: "invoice" as const,
      file,
      suffix: `invoice-${index}`,
    })),
  ];

  const files: CreateDocValidationFileInput[] = await Promise.all(
    uploads.map(async ({ dvfType, file, suffix }) => {
      const { key, fileUrl } = await R2StorageHelper.uploadDocValidationFile(
        file,
        claCode,
        dvaCode,
        suffix,
      );

      return {
        dvfType,
        fileKey: key,
        fileUrl,
        fileName: file.filename,
        fileMimetype: file.mimetype,
        fileSize: file.buffer.length,
      };
    }),
  );

  const validation = await createDocValidation({
    dvaCode,
    claCode,
    declaredData,
    files,
  });

  return { validationId: validation.dvaCode };
}
