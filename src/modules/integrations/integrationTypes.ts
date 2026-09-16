// Catálogo dos sistemas externos que podem receber dados de uma doc_validation. Cada valor aqui
// precisa ter um sender correspondente em integrationDispatcher.ts.
export const INTEGRATION_SYSTEMS = {
  PHIORI: "PHIORI",
} as const;

export type IntegrationSystem =
  (typeof INTEGRATION_SYSTEMS)[keyof typeof INTEGRATION_SYSTEMS];
