import { z } from "zod";
import { maskCpfCnpj, normalizePlate } from "./normalizeDocument";

function requiredString(fieldLabel: string) {
  return z
    .any()
    .transform((value) =>
      value === undefined || value === null ? "" : String(value),
    )
    .refine((value) => value !== "", {
      message: `${fieldLabel} não informado`,
    });
}

export const declaredDataSchema = z.object({
  contract: requiredString("Contrato"),
  plate: requiredString("Placa").transform(normalizePlate),
  invoiceRecipientName: requiredString("Nome do cliente"),
  invoiceRecipientDocument: requiredString("Documento do cliente").transform(
    maskCpfCnpj,
  ),
});
