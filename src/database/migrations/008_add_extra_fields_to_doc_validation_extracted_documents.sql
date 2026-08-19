ALTER TABLE doc_validation_extracted_documents
  ADD COLUMN dedExtraFields JSON NOT NULL AFTER dedData;
