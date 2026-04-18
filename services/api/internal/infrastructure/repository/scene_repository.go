package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"koconi/api/internal/domain"
)

type PgSceneRepository struct {
	pool *pgxpool.Pool
}

func NewSceneRepository(pool *pgxpool.Pool) *PgSceneRepository {
	return &PgSceneRepository{pool: pool}
}

func (r *PgSceneRepository) Create(ctx context.Context, scene domain.PlacementScene) (domain.PlacementScene, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO placement_scenes (placement_id, user_id, direction, image_key)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (placement_id, direction) DO UPDATE
		  SET image_key = EXCLUDED.image_key, created_at = NOW()
		RETURNING id, placement_id, user_id, direction, image_key, created_at
	`, scene.PlacementID, scene.UserID, scene.Direction, scene.ImageKey)
	return scanScene(row)
}

func (r *PgSceneRepository) ListByPlacementID(ctx context.Context, placementID int64) ([]domain.PlacementScene, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, placement_id, user_id, direction, image_key, created_at
		FROM placement_scenes WHERE placement_id = $1
		ORDER BY direction
	`, placementID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var scenes []domain.PlacementScene
	for rows.Next() {
		s, err := scanScene(rows)
		if err != nil {
			return nil, err
		}
		scenes = append(scenes, s)
	}
	return scenes, rows.Err()
}

type sceneScanner interface {
	Scan(dest ...any) error
}

func scanScene(row sceneScanner) (domain.PlacementScene, error) {
	var s domain.PlacementScene
	err := row.Scan(&s.ID, &s.PlacementID, &s.UserID, &s.Direction, &s.ImageKey, &s.CreatedAt)
	return s, err
}
