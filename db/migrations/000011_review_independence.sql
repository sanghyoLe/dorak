BEGIN;

ALTER TABLE community.reviews
  ADD COLUMN independent_visit_attested boolean;

COMMENT ON COLUMN community.reviews.independent_visit_attested IS
  'Author declaration of no sponsorship, review compensation, or restaurant affiliation. NULL means not collected. Not independent verification.';

COMMIT;
