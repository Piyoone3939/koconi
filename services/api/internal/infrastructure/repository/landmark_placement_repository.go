package repository

import (
	"context"
	"encoding/json"
	"errors"

	"koconi/api/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
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
	modelURL string,
) (domain.LandmarkPlacement, error) {
	rotationJSON, err := json.Marshal(rotation)
	if err != nil {
		return domain.LandmarkPlacement{}, err
	}

	q := `
		INSERT INTO landmark_placements
		    (photo_id, asset_id, lat, lng, scale, rotation_json, match_score, model_url)
		VALUES
		    ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
		RETURNING id, photo_id, asset_id, lat, lng, scale, rotation_json, match_score, model_url, created_at
	`

	var lp domain.LandmarkPlacement
	var rawRotation []byte
	err = r.pool.QueryRow(ctx, q, photoID, assetID, lat, lng, scale, rotationJSON, matchScore, modelURL).
		Scan(&lp.ID, &lp.PhotoID, &lp.AssetID, &lp.Lat, &lp.Lng, &lp.Scale, &rawRotation, &lp.MatchScore, &lp.ModelURL, &lp.CreatedAt)
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
		SELECT id, photo_id, asset_id, lat, lng, scale, rotation_json, match_score, model_url, created_at
		FROM (
		    SELECT DISTINCT ON (photo_id)
		        id, photo_id, asset_id, lat, lng, scale, rotation_json, match_score, model_url, created_at
		    FROM landmark_placements
		    WHERE lat BETWEEN $1 AND $2
		      AND lng BETWEEN $3 AND $4
		    ORDER BY photo_id, model_url DESC, created_at DESC
		) sub
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
			&lp.Scale, &rawRotation, &lp.MatchScore, &lp.ModelURL, &lp.CreatedAt,
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

func (r *PgLandmarkPlacementRepository) ListByUserTag(ctx context.Context, userTag string, limit int) ([]domain.LandmarkPlacement, error) {
	q := `
		SELECT id, photo_id, asset_id, lat, lng, scale, rotation_json, match_score, model_url, created_at
		FROM (
		    SELECT DISTINCT ON (lp.photo_id)
		        lp.id, lp.photo_id, lp.asset_id, lp.lat, lp.lng, lp.scale, lp.rotation_json, lp.match_score, lp.model_url, lp.created_at
		    FROM landmark_placements lp
		    JOIN photos p ON p.id = lp.photo_id
		    JOIN users u ON u.device_id = p.device_id
		    WHERE u.user_tag = $1
		    ORDER BY lp.photo_id, lp.model_url DESC, lp.created_at DESC
		) sub
		ORDER BY created_at DESC
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, q, userTag, limit)
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
			&lp.Scale, &rawRotation, &lp.MatchScore, &lp.ModelURL, &lp.CreatedAt,
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

func (r *PgLandmarkPlacementRepository) FindByPhotoIDWithModel(ctx context.Context, photoID int64) (*domain.LandmarkPlacement, error) {
	q := `
		SELECT id, photo_id, asset_id, lat, lng, scale, rotation_json, match_score, model_url, created_at
		FROM landmark_placements
		WHERE photo_id = $1 AND model_url != ''
		LIMIT 1
	`
	var lp domain.LandmarkPlacement
	var rawRotation []byte
	err := r.pool.QueryRow(ctx, q, photoID).
		Scan(&lp.ID, &lp.PhotoID, &lp.AssetID, &lp.Lat, &lp.Lng, &lp.Scale, &rawRotation, &lp.MatchScore, &lp.ModelURL, &lp.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	if err := json.Unmarshal(rawRotation, &lp.Rotation); err != nil {
		return nil, err
	}
	return &lp, nil
}
