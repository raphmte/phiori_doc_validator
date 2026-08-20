ALTER TABLE doc_validation_declared_data
  CHANGE COLUMN dvdCliName dvdInvoiceRecipientName VARCHAR(255) NOT NULL,
  CHANGE COLUMN dvdCliDocument dvdInvoiceRecipientDocument VARCHAR(20) NOT NULL;
