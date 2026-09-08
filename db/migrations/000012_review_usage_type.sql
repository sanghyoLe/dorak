BEGIN;

ALTER TABLE community.reviews
  ADD COLUMN usage_type text
  CONSTRAINT reviews_usage_type_check CHECK (usage_type IN ('dine_in', 'takeout', 'delivery'));

COMMENT ON COLUMN community.reviews.usage_type IS
  'Author-reported meal context. NULL means not collected; legacy reviews are not assumed to be dine-in.';
COMMENT ON COLUMN community.reviews.visited_on IS
  'Date the author ate the food, including dine-in, takeout, and delivery. Legacy column name retained for compatibility.';
COMMENT ON COLUMN community.reviews.visit_attested IS
  'Author declaration of personally eating food from this branch. Not independent verification.';

COMMIT;
