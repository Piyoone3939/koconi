package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PgStatsRepository struct {
	pool *pgxpool.Pool
}

func NewStatsRepository(pool *pgxpool.Pool) *PgStatsRepository {
	return &PgStatsRepository{pool: pool}
}

func (r *PgStatsRepository) CountPhotos(ctx context.Context) (int64, error) {
	var count int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM photos`).Scan(&count)
	return count, err
}

func (r *PgStatsRepository) CountPlacements(ctx context.Context) (int64, error) {
	var count int64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM landmark_placements WHERE model_url != ''`).Scan(&count)
	return count, err
}
