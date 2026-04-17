package repository

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"koconi/api/internal/domain"
	"koconi/api/internal/usecase"
)

type PgSearchRepository struct {
	pool *pgxpool.Pool
}

func NewSearchRepository(pool *pgxpool.Pool) *PgSearchRepository {
	return &PgSearchRepository{pool: pool}
}

func (r *PgSearchRepository) SearchUsers(ctx context.Context, query string, limit int) ([]usecase.User, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, device_id, display_name, user_tag, created_at
		FROM users
		WHERE display_name ILIKE '%' || $1 || '%'
		   OR user_tag ILIKE '%' || $1 || '%'
		ORDER BY created_at DESC
		LIMIT $2
	`, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]usecase.User, 0)
	for rows.Next() {
		var u usecase.User
		if err := rows.Scan(&u.ID, &u.DeviceID, &u.DisplayName, &u.UserTag, &u.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (r *PgSearchRepository) SearchTrips(ctx context.Context, query string, ownerUserID *int64, limit int) ([]domain.Trip, error) {
	var rows pgx.Rows
	var err error

	if ownerUserID != nil {
		rows, err = r.pool.Query(ctx, `
			SELECT id, owner_user_id, title, description, start_at, end_at, privacy_level, created_at
			FROM trips
			WHERE owner_user_id = $1
			  AND (title ILIKE '%' || $2 || '%' OR description ILIKE '%' || $2 || '%')
			ORDER BY created_at DESC
			LIMIT $3
		`, *ownerUserID, query, limit)
	} else {
		rows, err = r.pool.Query(ctx, `
			SELECT id, owner_user_id, title, description, start_at, end_at, privacy_level, created_at
			FROM trips
			WHERE privacy_level = 'public'
			  AND (title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%')
			ORDER BY created_at DESC
			LIMIT $2
		`, query, limit)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.Trip, 0)
	for rows.Next() {
		var t domain.Trip
		if err := rows.Scan(
			&t.ID, &t.OwnerUserID, &t.Title, &t.Description,
			&t.StartAt, &t.EndAt, &t.PrivacyLevel, &t.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *PgSearchRepository) SearchPlacements(ctx context.Context, query string, limit int) ([]domain.LandmarkPlacement, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, photo_id, asset_id, lat, lng, scale, rotation_json, match_score, model_url, created_at
		FROM landmark_placements
		WHERE asset_id ILIKE '%' || $1 || '%'
		ORDER BY created_at DESC
		LIMIT $2
	`, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.LandmarkPlacement, 0)
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
