ALTER TABLE doc_validation_declared_data
  MODIFY COLUMN dvdGrossWeightKg DECIMAL(12, 2) NULL,
  MODIFY COLUMN dvdTareWeightKg DECIMAL(12, 2) NULL,
  MODIFY COLUMN dvdNetWeightKg DECIMAL(12, 2) NULL,
  MODIFY COLUMN dvdInvoiceTotalValue DECIMAL(12, 4) NULL;
