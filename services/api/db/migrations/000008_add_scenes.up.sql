BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS placement_scenes (
  id            BIGSERIAL PRIMARY KEY,
  placement_id  BIGINT NOT NULL REFERENCES landmark_placements(id) ON DELETE CASCADE,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction     TEXT NOT NULL CHECK (direction IN ('N', 'E', 'S', 'W')),
  image_key     TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (placement_id, direction)
);

CREATE INDEX IF NOT EXISTS idx_placement_scenes_placement ON placement_scenes(placement_id);

COMMIT;
