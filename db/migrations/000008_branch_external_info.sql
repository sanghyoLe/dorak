BEGIN;

ALTER TABLE catalog.branches
  ADD COLUMN opening_hours text,
  ADD COLUMN closed_days text,
  ADD COLUMN external_info_source text,
  ADD COLUMN external_info_updated_at timestamptz;

COMMIT;
