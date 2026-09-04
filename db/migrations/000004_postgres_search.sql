BEGIN;

ALTER TABLE catalog.branches
  ADD COLUMN search_text text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION catalog.refresh_branch_search_text()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, catalog
AS $$
BEGIN
  NEW.search_text := concat_ws(
    ' ',
    NEW.name,
    NEW.neighborhood,
    NEW.district,
    NEW.road_address,
    NEW.cuisine_key,
    NEW.short_description,
    array_to_string(NEW.signature_menu, ' ')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER branches_refresh_search_text
BEFORE INSERT OR UPDATE OF
  name,
  neighborhood,
  district,
  road_address,
  cuisine_key,
  short_description,
  signature_menu
ON catalog.branches
FOR EACH ROW
EXECUTE FUNCTION catalog.refresh_branch_search_text();

UPDATE catalog.branches
SET search_text = concat_ws(
  ' ',
  name,
  neighborhood,
  district,
  road_address,
  cuisine_key,
  short_description,
  array_to_string(signature_menu, ' ')
);

CREATE INDEX branches_search_text_trgm_idx
  ON catalog.branches USING gin (search_text gin_trgm_ops)
  WHERE status = 'active';

CREATE INDEX branches_search_fts_idx
  ON catalog.branches USING gin (to_tsvector('simple'::regconfig, search_text))
  WHERE status = 'active';

COMMIT;
