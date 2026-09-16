-- Fila de integrações com sistemas externos (o próprio PHIORI é o primeiro). Cada linha é "esta
-- doc_validation precisa ser enviada para aquele sistema", desacoplado do webhook do cliente
-- (doc_validation_deliveries): o job desta fila roda depois e busca os dados no banco por
-- dvaCode no momento do envio, em vez de carregar um payload congelado aqui.
CREATE TABLE IF NOT EXISTS doc_validation_integrations (
  dinCode BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  dinStatus VARCHAR(1) NOT NULL DEFAULT 'A',
  dvaCode BIGINT UNSIGNED NOT NULL,
  dinSystem VARCHAR(50) NOT NULL,
  dinAttempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  dinLastError TEXT NULL,
  dinLastProcessStartedAt DATETIME NULL,
  dinCreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dinUpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX ixDocValidationIntegrationsDvaCode (dvaCode),
  INDEX ixDocValidationIntegrationsStatus (dinStatus),
  CONSTRAINT fkDocValidationIntegrationsDvaCode FOREIGN KEY (dvaCode) REFERENCES doc_validations (dvaCode)
) ENGINE = InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
