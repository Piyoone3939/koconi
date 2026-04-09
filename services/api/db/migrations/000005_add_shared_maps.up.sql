BEGIN;

CREATE TABLE IF NOT EXISTS shared_maps (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_map_members (
  map_id  BIGINT NOT NULL REFERENCES shared_maps(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (map_id, user_id)
);

CREATE TABLE IF NOT EXISTS shared_map_placements (
  map_id           BIGINT NOT NULL REFERENCES shared_maps(id) ON DELETE CASCADE,
  placement_id     BIGINT NOT NULL REFERENCES landmark_placements(id) ON DELETE CASCADE,
  added_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (map_id, placement_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_map_members_user ON shared_map_members(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_map_placements_map ON shared_map_placements(map_id);

COMMIT;
