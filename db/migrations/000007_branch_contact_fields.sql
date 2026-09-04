BEGIN;

ALTER TABLE catalog.branches
  ADD COLUMN phone text,
  ADD COLUMN website_url text;

COMMIT;
