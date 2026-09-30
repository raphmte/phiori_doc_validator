// Traders do PHIORI que o doc_validator sabe montar corpo de shipment. Hoje só a COFCO está
// implementada (source: 'provided' — pesos + chaves das notas, ver sendToPhiori.ts). Adicionar
// um valor aqui sem implementar o corpo correspondente em sendToPhiori.ts faz o envio falhar em
// runtime (ver requireSupportedTraderBody lá).
export const PHIORI_TRADERS = ["cofco"] as const;

export type PhioriTrader = (typeof PHIORI_TRADERS)[number];

export function isPhioriTrader(value: string): value is PhioriTrader {
  return (PHIORI_TRADERS as readonly string[]).includes(value);
}
