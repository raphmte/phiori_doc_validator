CREATE TABLE IF NOT EXISTS doc_validation_deliveries (
  ddvCode BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  dvaCode BIGINT UNSIGNED NOT NULL,
  webCode BIGINT UNSIGNED NOT NULL,
  ddvUrl VARCHAR(500) NOT NULL,
  ddvMethod VARCHAR(10) NOT NULL,
  ddvPayload TEXT NOT NULL,
  ddvStatusCode SMALLINT UNSIGNED NULL,
  ddvResponseBody TEXT NULL,
  ddvSuccess TINYINT(1) NOT NULL DEFAULT 0,
  ddvError TEXT NULL,
  ddvCreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ixDocValidationDeliveriesDvaCode (dvaCode),
  CONSTRAINT fkDocValidationDeliveriesDvaCode FOREIGN KEY (dvaCode) REFERENCES doc_validations (dvaCode),
  CONSTRAINT fkDocValidationDeliveriesWebCode FOREIGN KEY (webCode) REFERENCES webhooks (webCode)
) ENGINE = InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
