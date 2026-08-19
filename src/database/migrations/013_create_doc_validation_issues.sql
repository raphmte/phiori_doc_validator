CREATE TABLE IF NOT EXISTS doc_validation_issues (
  dviCode BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  dvaCode BIGINT UNSIGNED NOT NULL,
  dviType VARCHAR(50) NOT NULL,
  dviMessage TEXT NOT NULL,
  dviData TEXT NOT NULL,
  dviCreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ixDocValidationIssuesDvaCode (dvaCode),
  CONSTRAINT fkDocValidationIssuesDvaCode FOREIGN KEY (dvaCode) REFERENCES doc_validations (dvaCode)
) ENGINE = InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
