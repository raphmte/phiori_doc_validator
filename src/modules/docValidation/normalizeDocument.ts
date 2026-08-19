// CPF (11 dígitos) e CNPJ (14 dígitos) são sempre salvos/enviados com a máscara oficial.
// Usado tanto para o que o cliente declara (createDocValidationController) quanto para
// documentos extraídos pela IA, que voltam só com dígitos (ver DOC_VALIDATION_EXTRACTION_PROMPT).
// Quantidade de dígitos fora desses dois formatos fica só com os dígitos, sem máscara, em vez
// de quebrar a requisição.
export function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return digits;
}

export const roundDecimal = (value: number) => Math.round(value * 100) / 100;
export const roundMonetary = (value: number) => Math.round(value * 10000) / 10000;
export const normalizePlate = (value: string) => value.toUpperCase().replace(/[\s-]/g, "");
export const normalizeAccessKey = (value: string) => value.replace(/\D/g, "");

// DDD + celular (9 dígitos) ou DDD + fixo (8 dígitos), mesma lógica de fallback do CPF/CNPJ:
// quantidade de dígitos fora desses dois formatos fica só com os dígitos, sem máscara.
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return digits;
}
