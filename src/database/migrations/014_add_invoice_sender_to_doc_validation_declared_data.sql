ALTER TABLE doc_validation_declared_data
  ADD COLUMN dvdInvoiceSenderName VARCHAR(255) NOT NULL AFTER dvdInvoiceRecipientDocument,
  ADD COLUMN dvdInvoiceSenderDocument VARCHAR(20) NOT NULL AFTER dvdInvoiceSenderName;
