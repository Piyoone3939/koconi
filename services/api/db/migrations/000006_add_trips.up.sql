BEGIN;

CREATE TABLE IF NOT EXISTS trips (
  id            BIGSERIAL PRIMARY KEY,
  owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  start_at      TIMESTAMPTZ,
  end_at        TIMESTAMPTZ,
  privacy_level TEXT NOT NULL DEFAULT 'private',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_owner ON trips(owner_user_id);

COMMIT;
