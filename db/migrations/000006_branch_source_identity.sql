BEGIN;

ALTER TABLE catalog.branches
  ADD COLUMN source_key text NOT NULL DEFAULT 'dorak.manual',
  ADD COLUMN source_record_id text,
  ADD COLUMN source_updated_at timestamptz;

UPDATE catalog.branches
SET source_record_id = public_id
WHERE source_record_id IS NULL;

ALTER TABLE catalog.branches
  ALTER COLUMN source_record_id SET NOT NULL;

CREATE UNIQUE INDEX branches_source_identity_idx
  ON catalog.branches (source_key, source_record_id);

COMMIT;
