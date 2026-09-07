BEGIN;

CREATE TABLE community.saved_branches (
  user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES catalog.branches(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, branch_id)
);

CREATE INDEX saved_branches_user_created_idx
  ON community.saved_branches (user_id, created_at DESC, branch_id);

COMMENT ON TABLE community.saved_branches IS
  'User-owned restaurant bookmarks.';

COMMIT;
