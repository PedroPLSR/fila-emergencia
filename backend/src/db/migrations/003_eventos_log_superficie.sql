ALTER TABLE eventos_log
  ADD COLUMN IF NOT EXISTS superficie_ator TEXT;

UPDATE eventos_log
SET superficie_ator = 'painel'
WHERE superficie_ator IS NULL;

ALTER TABLE eventos_log
  ALTER COLUMN superficie_ator SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'eventos_log_superficie_ator_check'
  ) THEN
    ALTER TABLE eventos_log
      ADD CONSTRAINT eventos_log_superficie_ator_check
      CHECK (superficie_ator IN ('totem', 'painel'));
  END IF;
END $$;
