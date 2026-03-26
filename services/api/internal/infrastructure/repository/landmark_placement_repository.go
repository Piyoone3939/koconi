package repository

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
	"koconi/api/internal/domain"
)

type PgLandmarkPlacementRepository struct {
	pool *pgxpool.Pool
}

func NewLandmarkPlacementRepository(pool *pgxpool.Pool) *PgLandmarkPlacementRepository {
	return &PgLandmarkPlacementRepository{pool: pool}
}

func (r *PgLandmarkPlacementRepository) Create(
	ctx context.Context,
	photoID int64,
	assetID string,
	lat, lng float64,
	scale float64,
	rotation []float64,
	matchScore *float64,
) (domain.LandmarkPlacement, error) {
	rotationJSON, err := json.Marshal(rotation)
	if err != nil {
		return domain.LandmarkPlacement{}, err
	}

	q := `
        INSERT INTO landmark_placements
            (photo_id, asset_id, lat, lng, scale, rotation_json, match_score)
        VALUES
            ($1, $2, $3, $4, $5, $6::jsonb, $7)
        RETURNING id, photo_id, asset_id, lat, lng, scale, rotation_json, match_score, created_at
    `

	var lp domain.LandmarkPlacement
	var rawRotation []byte
	err = r.pool.QueryRow(ctx, q, photoID, assetID, lat, lng, scale, rotationJSON, matchScore).
		Scan(&lp.ID, &lp.PhotoID, &lp.AssetID, &lp.Lat, &lp.Lng, &lp.Scale, &rawRotation, &lp.MatchScore, &lp.CreatedAt)
	if err != nil {
		return domain.LandmarkPlacement{}, err
	}

	if err := json.Unmarshal(rawRotation, &lp.Rotation); err != nil {
		return domain.LandmarkPlacement{}, err
	}
	return lp, nil
}

func (r *PgLandmarkPlacementRepository) ListByBounds(
	ctx context.Context,
	minLat, maxLat, minLng, maxLng float64,
	limit int,
) ([]domain.LandmarkPlacement, error) {
	q := `
        SELECT id, photo_id, asset_id, lat, lng, scale, rotation_json, match_score, created_at
        FROM landmark_placements
        WHERE lat BETWEEN $1 AND $2
          AND lng BETWEEN $3 AND $4
        ORDER BY created_at DESC
        LIMIT $5
    `
	rows, err := r.pool.Query(ctx, q, minLat, maxLat, minLng, maxLng, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.LandmarkPlacement, 0, limit)
	for rows.Next() {
		var lp domain.LandmarkPlacement
		var rawRotation []byte
		if err := rows.Scan(
			&lp.ID, &lp.PhotoID, &lp.AssetID, &lp.Lat, &lp.Lng,
			&lp.Scale, &rawRotation, &lp.MatchScore, &lp.CreatedAt,
		); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(rawRotation, &lp.Rotation); err != nil {
			return nil, err
		}
		out = append(out, lp)
	}
	return out, rows.Err()
}
