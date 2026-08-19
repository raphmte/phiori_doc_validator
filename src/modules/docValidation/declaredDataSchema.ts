import { z } from "zod";
import { maskCpfCnpj, normalizePlate } from "./normalizeDocument";

function requiredString(fieldLabel: string) {
  return z
    .any()
    .transform((value) => (value === undefined || value === null ? "" : String(value)))
    .refine((value) => value !== "", { message: `${fieldLabel} não informado` });
}

// Campos recebidos da outra API (fora dos arquivos), nos nomes que ela usa. São traduzidos aqui
// para os nomes internos (contract, plate) usados pelo resto do módulo de doc validation.
export const declaredDataSchema = z
  .object({
    sorContract: requiredString("Contrato"),
    loaLicensePlate: requiredString("Placa").transform(normalizePlate),
    cliName: requiredString("Nome do cliente"),
    cliDocument: requiredString("Documento do cliente").transform(maskCpfCnpj),
  })
  .transform(({ sorContract, loaLicensePlate, cliName, cliDocument }) => ({
    contract: sorContract,
    plate: loaLicensePlate,
    cliName,
    cliDocument,
  }));
