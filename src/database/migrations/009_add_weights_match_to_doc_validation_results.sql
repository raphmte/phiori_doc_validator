ALTER TABLE doc_validation_results
  ADD COLUMN dvrWeightsMatch TINYINT(1) NOT NULL AFTER dvrPlateConfidencePercent;
