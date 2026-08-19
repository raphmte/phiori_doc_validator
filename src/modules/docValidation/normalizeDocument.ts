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

export const normalizePlate = (value: string) => value.toUpperCase().replace(/[\s-]/g, "");
