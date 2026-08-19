import { z } from "zod";
import {
  maskCpfCnpj,
  normalizeAccessKey,
  normalizePhone,
  normalizePlate,
  roundDecimal,
  roundMonetary,
} from "./normalizeDocument";

function requiredString(fieldLabel: string) {
  return z
    .any()
    .transform((value) => (value === undefined || value === null ? "" : String(value)))
    .refine((value) => value !== "", { message: `${fieldLabel} não informado` });
}

function requiredNumber(fieldLabel: string) {
  return z
    .any()
    .refine((value) => value !== undefined && value !== null && value !== "", {
      message: `${fieldLabel} não informado`,
    })
    .transform((value, ctx) => {
      const parsed = Number(value);
      if (Number.isNaN(parsed)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Valor numérico inválido: ${value}` });
        return z.NEVER;
      }
      return parsed;
    });
}

// Todos os campos são obrigatórios na validação de documentos, mesmo os que o banco
// permite nulos (ver DeclaredDocumentData em ./types) — regra de negócio, não do schema do banco.
export const declaredDataSchema = z.object({
  plate: requiredString("Placa").transform(normalizePlate),
  grossWeightKg: requiredNumber("Peso bruto").transform(roundDecimal),
  tareWeightKg: requiredNumber("Peso da tara").transform(roundDecimal),
  netWeightKg: requiredNumber("Peso líquido").transform(roundDecimal),
  loadingOrder: requiredNumber("Ordem de carregamento"),
  contract: requiredString("Contrato"),
  accessKey: requiredString("Chave de acesso").transform(normalizeAccessKey),
  driverName: requiredString("Nome do motorista"),
  driverDocument: requiredString("Documento do motorista").transform(maskCpfCnpj),
  driverPhone: requiredString("Telefone do motorista").transform(normalizePhone),
  invoiceRecipientName: requiredString("Nome do destinatário da nota fiscal"),
  invoiceRecipientDocument: requiredString(
    "Documento do destinatário da nota fiscal"
  ).transform(maskCpfCnpj),
  invoiceSenderName: requiredString("Nome do remetente da nota fiscal"),
  invoiceSenderDocument: requiredString(
    "Documento do remetente da nota fiscal"
  ).transform(maskCpfCnpj),
  invoiceDate: requiredString("Data da nota fiscal"),
  invoiceUnitValue: requiredNumber("Valor unitário da nota fiscal").transform(roundMonetary),
  invoiceTotalValue: requiredNumber("Valor total da nota fiscal").transform(roundMonetary),
});
