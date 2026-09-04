BEGIN;

CREATE TABLE ingestion.sources (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  source_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  provenance text NOT NULL CHECK (provenance IN ('synthetic', 'approved_source')),
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ingestion.raw_documents (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  source_id uuid NOT NULL REFERENCES ingestion.sources(id),
  source_record_id text NOT NULL,
  payload jsonb NOT NULL,
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
  fetched_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, source_record_id, payload_sha256)
);

CREATE TABLE ops.branch_candidates (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  public_id text NOT NULL UNIQUE CHECK (public_id ~ '^cand_[A-Za-z0-9_-]{16,32}$'),
  raw_document_id uuid NOT NULL REFERENCES ingestion.raw_documents(id),
  proposed_name text NOT NULL,
  proposed_address text NOT NULL,
  proposed_cuisine_key text,
  normalized_payload jsonb NOT NULL,
  confidence numeric(5, 4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (status = 'pending' AND decided_at IS NULL)
    OR (status IN ('approved', 'rejected') AND decided_at IS NOT NULL)
  )
);

CREATE INDEX branch_candidates_pending_idx
  ON ops.branch_candidates (created_at, id)
  WHERE status = 'pending';

CREATE TABLE catalog.branches (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  public_id text NOT NULL UNIQUE CHECK (public_id ~ '^br_[A-Za-z0-9_-]{16,32}$'),
  approved_candidate_id uuid UNIQUE REFERENCES ops.branch_candidates(id),
  name text NOT NULL,
  neighborhood text NOT NULL,
  district text NOT NULL,
  road_address text NOT NULL,
  cuisine_key text NOT NULL,
  short_description text NOT NULL,
  price_band smallint NOT NULL CHECK (price_band BETWEEN 1 AND 4),
  location geography(Point, 4326),
  provenance text NOT NULL CHECK (provenance IN ('synthetic', 'approved_source')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX branches_location_gist_idx ON catalog.branches USING gist (location);
CREATE INDEX branches_name_trgm_idx ON catalog.branches USING gin (name gin_trgm_ops);

CREATE TABLE platform.audit_log (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  before_state jsonb,
  after_state jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_entity_idx
  ON platform.audit_log (entity_type, entity_id, occurred_at DESC);

CREATE TABLE platform.outbox_events (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  public_id text NOT NULL UNIQUE CHECK (public_id ~ '^evt_[A-Za-z0-9_-]{16,32}$'),
  event_name text NOT NULL CHECK (event_name ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  schema_version integer NOT NULL CHECK (schema_version > 0),
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error text
);

CREATE INDEX outbox_events_unpublished_idx
  ON platform.outbox_events (occurred_at, id)
  WHERE published_at IS NULL;

COMMIT;
