CREATE TABLE IF NOT EXISTS doc_validation_extracted_documents (
  dedCode BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  dvaCode BIGINT UNSIGNED NOT NULL,
  dedType VARCHAR(30) NOT NULL,
  dedData JSON NOT NULL,
  dedCreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dedUpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX ixDocValidationExtractedDocumentsDvaCode (dvaCode),
  CONSTRAINT fkDocValidationExtractedDocumentsDvaCode FOREIGN KEY (dvaCode) REFERENCES doc_validations (dvaCode)
) ENGINE = InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE doc_validations DROP COLUMN dvaResult;
