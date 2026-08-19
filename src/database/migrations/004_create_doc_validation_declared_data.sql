CREATE TABLE IF NOT EXISTS doc_validation_declared_data (
  dvaCode BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  dvdPlate VARCHAR(20) NULL,
  dvdGrossWeightKg DECIMAL(12, 3) NULL,
  dvdTareWeightKg DECIMAL(12, 3) NULL,
  dvdNetWeightKg DECIMAL(12, 3) NULL,
  dvdLoadingOrder INT NULL,
  dvdContract VARCHAR(100) NULL,
  dvdAccessKey VARCHAR(44) NULL,
  dvdDriverName VARCHAR(255) NULL,
  dvdDriverDocument VARCHAR(20) NULL,
  dvdDriverPhone VARCHAR(20) NULL,
  dvdInvoiceDate VARCHAR(30) NULL,
  dvdInvoiceUnitValue DECIMAL(12, 4) NULL,
  dvdInvoiceTotalValue DECIMAL(12, 2) NULL,
  dvdCreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dvdUpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fkDocValidationDeclaredDataDvaCode FOREIGN KEY (dvaCode) REFERENCES doc_validations (dvaCode)
) ENGINE = InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE doc_validations DROP COLUMN dvaDeclaredData;
