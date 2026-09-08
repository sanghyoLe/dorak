BEGIN;

CREATE TABLE community.review_reports (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  public_id text NOT NULL UNIQUE
    CHECK (public_id ~ '^rr_[A-Za-z0-9_-]{16,32}$'),
  review_id uuid NOT NULL REFERENCES community.reviews(id) ON DELETE CASCADE,
  reporter_user_id uuid REFERENCES identity.users(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason IN (
    'false_experience',
    'undisclosed_interest',
    'privacy',
    'harassment',
    'discrimination',
    'threat_safety',
    'advertising_spam',
    'copyright',
    'restaurant_info',
    'other'
  )),
  detail text NOT NULL CHECK (char_length(detail) BETWEEN 10 AND 1000 AND detail = btrim(detail)),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved', 'dismissed')),
  decision_note text,
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX review_reports_reporter_review_reason_idx
  ON community.review_reports (reporter_user_id, review_id, reason)
  WHERE reporter_user_id IS NOT NULL;

CREATE INDEX review_reports_status_created_idx
  ON community.review_reports (status, created_at DESC, id DESC);

CREATE INDEX review_reports_review_idx
  ON community.review_reports (review_id, created_at DESC, id DESC);

COMMENT ON TABLE community.review_reports IS
  'Private reports about public reviews. Report details are for moderation only.';
COMMENT ON COLUMN community.review_reports.reporter_user_id IS
  'Nullable so signed-out users can report; null means the report was anonymous.';
COMMENT ON COLUMN community.review_reports.decision_note IS
  'Internal moderation note. Never exposed on the public review page.';

COMMIT;
