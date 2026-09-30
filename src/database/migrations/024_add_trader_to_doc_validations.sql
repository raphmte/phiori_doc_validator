-- Trader de destino no PHIORI, informada pelo cliente na criação da validação (antes disso era
-- uma constante fixa em sendToPhiori.ts). Hoje só existe a COFCO (ver
-- src/modules/integrations/providers/phioriTraders.ts) — o DEFAULT cobre as linhas já existentes,
-- que foram todas implicitamente para a COFCO antes deste campo existir.
ALTER TABLE doc_validations
  ADD COLUMN dvaTrader VARCHAR(50) NOT NULL DEFAULT 'cofco' AFTER claCode;
