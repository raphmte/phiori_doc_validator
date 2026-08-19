CREATE TABLE IF NOT EXISTS doc_validation_matched_invoices (
  dvaCode BIGINT UNSIGNED NOT NULL,
  dmiAccessKey VARCHAR(44) NOT NULL,
  PRIMARY KEY (dvaCode, dmiAccessKey),
  CONSTRAINT fkDocValidationMatchedInvoicesDvaCode FOREIGN KEY (dvaCode) REFERENCES doc_validations (dvaCode)
) ENGINE = InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE doc_validation_results DROP COLUMN dvrMatchedInvoiceAccessKey;
