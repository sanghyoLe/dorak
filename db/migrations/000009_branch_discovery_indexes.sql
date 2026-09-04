BEGIN;

CREATE INDEX branches_active_browse_idx
  ON catalog.branches (provenance, created_at, public_id)
  WHERE status = 'active';

CREATE INDEX branches_active_cuisine_browse_idx
  ON catalog.branches (provenance, cuisine_key, created_at, public_id)
  WHERE status = 'active';

COMMIT;
