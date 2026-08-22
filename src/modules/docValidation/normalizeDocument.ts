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

// Celular (11 dígitos, com o 9º dígito) e telefone fixo (10 dígitos) recebem máscara diferente.
// Fora desses dois formatos, fica só com os dígitos, sem máscara.
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return digits;
}

// Normaliza pra "AAAA-MM-DD". A data da nota fiscal chega da extração em "DD/MM/AAAA" (às vezes
// com hora junto); se já vier em ISO, mantém. Formato não reconhecido volta null em vez de
// arriscar uma data errada.
export function toIsoDate(value: string): string | null {
  const brMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month}-${day}`;
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return isoMatch[0];
  }

  return null;
}
