ALTER TABLE doc_validation_declared_data
  ADD COLUMN dvdInvoiceRecipientName VARCHAR(255) NOT NULL AFTER dvdDriverPhone,
  ADD COLUMN dvdInvoiceRecipientDocument VARCHAR(20) NOT NULL AFTER dvdInvoiceRecipientName,
  MODIFY COLUMN dvdPlate VARCHAR(20) NOT NULL;
