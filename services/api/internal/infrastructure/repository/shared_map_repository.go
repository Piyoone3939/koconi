package repository

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"koconi/api/internal/domain"
)

type PgSharedMapRepository struct {
	pool *pgxpool.Pool
}

func NewSharedMapRepository(pool *pgxpool.Pool) *PgSharedMapRepository {
	return &PgSharedMapRepository{pool: pool}
}

func (r *PgSharedMapRepository) Create(ctx context.Context, name string, ownerUserID int64) (domain.SharedMap, error) {
	var m domain.SharedMap
	err := r.pool.QueryRow(ctx, `
		INSERT INTO shared_maps (name, owner_user_id)
		VALUES ($1, $2)
		RETURNING id, name, owner_user_id, created_at
	`, name, ownerUserID).Scan(&m.ID, &m.Name, &m.OwnerUserID, &m.CreatedAt)
	return m, err
}

func (r *PgSharedMapRepository) ListByUserID(ctx context.Context, userID int64) ([]domain.SharedMap, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT sm.id, sm.name, sm.owner_user_id, sm.created_at
		FROM shared_maps sm
		JOIN shared_map_members smm ON smm.map_id = sm.id
		WHERE smm.user_id = $1
		ORDER BY sm.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.SharedMap, 0)
	for rows.Next() {
		var m domain.SharedMap
		if err := rows.Scan(&m.ID, &m.Name, &m.OwnerUserID, &m.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (r *PgSharedMapRepository) FindByID(ctx context.Context, mapID int64) (*domain.SharedMap, error) {
	var m domain.SharedMap
	err := r.pool.QueryRow(ctx, `
		SELECT id, name, owner_user_id, created_at FROM shared_maps WHERE id = $1
	`, mapID).Scan(&m.ID, &m.Name, &m.OwnerUserID, &m.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &m, nil
}

func (r *PgSharedMapRepository) AddMember(ctx context.Context, mapID, userID int64) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO shared_map_members (map_id, user_id) VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, mapID, userID)
	return err
}

func (r *PgSharedMapRepository) AddPlacement(ctx context.Context, mapID, placementID, addedByUserID int64) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO shared_map_placements (map_id, placement_id, added_by_user_id) VALUES ($1, $2, $3)
		ON CONFLICT DO NOTHING
	`, mapID, placementID, addedByUserID)
	return err
}

func (r *PgSharedMapRepository) ListPlacements(ctx context.Context, mapID int64) ([]domain.LandmarkPlacement, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT lp.id, lp.photo_id, lp.asset_id, lp.lat, lp.lng, lp.scale,
		       lp.rotation_json, lp.match_score, lp.model_url, lp.created_at
		FROM landmark_placements lp
		JOIN shared_map_placements smp ON smp.placement_id = lp.id
		WHERE smp.map_id = $1
		ORDER BY smp.added_at DESC
	`, mapID)
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

func (r *PgSharedMapRepository) IsMember(ctx context.Context, mapID, userID int64) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM shared_map_members WHERE map_id = $1 AND user_id = $2)
	`, mapID, userID).Scan(&exists)
	return exists, err
}
