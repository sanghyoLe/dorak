BEGIN;

CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS community;

CREATE TABLE identity.users (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity.sessions (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_idx ON identity.sessions (user_id);
CREATE INDEX sessions_expires_idx ON identity.sessions (expires_at);

CREATE TABLE identity.accounts (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  issuer text NOT NULL,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  access_token text,
  refresh_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  id_token text,
  password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer, account_id)
);

CREATE INDEX accounts_user_idx ON identity.accounts (user_id);

CREATE TABLE identity.verifications (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX verifications_identifier_idx
  ON identity.verifications (identifier);

CREATE TABLE community.reviews (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  public_id text NOT NULL UNIQUE
    CHECK (public_id ~ '^rv_[A-Za-z0-9_-]{16,32}$'),
  branch_id uuid NOT NULL REFERENCES catalog.branches(id) ON DELETE CASCADE,
  reviewer_user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
  author_name text NOT NULL
    CHECK (char_length(author_name) BETWEEN 2 AND 20 AND author_name = btrim(author_name)),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL
    CHECK (char_length(body) BETWEEN 20 AND 1000 AND body = btrim(body)),
  visited_on date NOT NULL,
  visit_attested boolean NOT NULL CHECK (visit_attested),
  identity_verified boolean NOT NULL,
  visit_verification text NOT NULL DEFAULT 'self_reported'
    CHECK (visit_verification IN ('self_reported', 'receipt', 'reservation')),
  status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (branch_id, reviewer_user_id)
);

CREATE INDEX reviews_branch_published_idx
  ON community.reviews (branch_id, created_at DESC, id DESC)
  WHERE status = 'published';

CREATE INDEX reviews_moderation_idx
  ON community.reviews (status, created_at DESC, id DESC);

CREATE INDEX reviews_reviewer_rate_idx
  ON community.reviews (reviewer_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION catalog.refresh_branch_review_aggregate(target_branch_id uuid)
RETURNS void
LANGUAGE sql
SET search_path = pg_catalog, catalog, community
AS $$
  UPDATE catalog.branches AS branch
  SET
    rating = aggregate.rating,
    review_count = aggregate.review_count,
    updated_at = now()
  FROM (
    SELECT
      round(avg(review.rating)::numeric, 2) AS rating,
      count(*)::int AS review_count
    FROM community.reviews AS review
    WHERE review.branch_id = target_branch_id
      AND review.status = 'published'
  ) AS aggregate
  WHERE branch.id = target_branch_id;
$$;

CREATE OR REPLACE FUNCTION community.refresh_review_branch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, catalog, community
AS $$
BEGIN
  IF TG_OP <> 'DELETE' THEN
    PERFORM catalog.refresh_branch_review_aggregate(NEW.branch_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM catalog.refresh_branch_review_aggregate(OLD.branch_id);
  ELSIF TG_OP = 'UPDATE' AND OLD.branch_id IS DISTINCT FROM NEW.branch_id THEN
    PERFORM catalog.refresh_branch_review_aggregate(OLD.branch_id);
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER reviews_refresh_branch
AFTER INSERT OR UPDATE OR DELETE ON community.reviews
FOR EACH ROW
EXECUTE FUNCTION community.refresh_review_branch();

COMMIT;
