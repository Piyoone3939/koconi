BEGIN;

ALTER TABLE landmark_placements
    DROP COLUMN IF EXISTS model_url;

COMMIT;
