export const webTypes = ["DOC_VALIDATOR"] as const;

export type WebType = (typeof webTypes)[number];
