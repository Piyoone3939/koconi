BEGIN;

CREATE TABLE IF NOT EXISTS "Memory" (
id BIGSERIAL PRIMARY KEY,
title TEXT NOT NULL,
description TEXT NULL,
"createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
id BIGSERIAL PRIMARY KEY,
device_id TEXT NOT NULL,
lat DOUBLE PRECISION NOT NULL,
lng DOUBLE PRECISION NOT NULL,
captured_at TIMESTAMPTZ NOT NULL,
image_key TEXT NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS landmark_placements (
id BIGSERIAL PRIMARY KEY,
photo_id BIGINT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
asset_id TEXT NOT NULL,
lat DOUBLE PRECISION NOT NULL,
lng DOUBLE PRECISION NOT NULL,
scale DOUBLE PRECISION NOT NULL DEFAULT 1.0,
rotation_json JSONB NOT NULL DEFAULT '[0,0,0]'::jsonb,
match_score DOUBLE PRECISION NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_device_id ON photos(device_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_placements_photo_id ON landmark_placements(photo_id);
CREATE INDEX IF NOT EXISTS idx_placements_lat_lng ON landmark_placements(lat, lng);
CREATE INDEX IF NOT EXISTS idx_placements_created_at ON landmark_placements(created_at DESC);

COMMIT;