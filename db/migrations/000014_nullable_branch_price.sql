BEGIN;

ALTER TABLE catalog.branches
  ALTER COLUMN price_band DROP NOT NULL;

UPDATE catalog.branches
SET price_band = NULL,
    updated_at = now()
WHERE source_key = 'seoul.localdata.general_restaurant'
  AND price_band = 2;

COMMIT;
