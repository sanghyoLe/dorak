BEGIN;

ALTER TABLE catalog.branches
  ADD COLUMN signature_menu text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN rating numeric(3, 2) CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  ADD COLUMN source_version integer NOT NULL DEFAULT 1 CHECK (source_version > 0),
  ADD COLUMN last_verified_at timestamptz;

COMMIT;
