package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"koconi/api/internal/domain"
)

type PgPhotoRepository struct {
	pool *pgxpool.Pool
}

func NewPhotoRepository(pool *pgxpool.Pool) *PgPhotoRepository {
	return &PgPhotoRepository{pool: pool}
}

func (r *PgPhotoRepository) Create(
	ctx context.Context,
	deviceID string,
	lat, lng float64,
	capturedAt time.Time,
	imageKey string,
) (domain.Photo, error) {
	q := `
        INSERT INTO photos (device_id, lat, lng, captured_at, image_key)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, device_id, lat, lng, captured_at, image_key, created_at
    `
	var p domain.Photo
	err := r.pool.QueryRow(ctx, q, deviceID, lat, lng, capturedAt, imageKey).
		Scan(&p.ID, &p.DeviceID, &p.Lat, &p.Lng, &p.CapturedAt, &p.ImageKey, &p.CreatedAt)
	return p, err
}

func (r *PgPhotoRepository) GetByID(ctx context.Context, id int64) (domain.Photo, error) {
	q := `
        SELECT id, device_id, lat, lng, captured_at, image_key, created_at
        FROM photos
        WHERE id = $1
    `
	var p domain.Photo
	err := r.pool.QueryRow(ctx, q, id).
		Scan(&p.ID, &p.DeviceID, &p.Lat, &p.Lng, &p.CapturedAt, &p.ImageKey, &p.CreatedAt)
	return p, err
}

func (r *PgPhotoRepository) ListByDevice(ctx context.Context, deviceID string, limit int) ([]domain.Photo, error) {
	q := `
        SELECT id, device_id, lat, lng, captured_at, image_key, created_at
        FROM photos
        WHERE device_id = $1
        ORDER BY created_at DESC
        LIMIT $2
    `
	rows, err := r.pool.Query(ctx, q, deviceID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.Photo, 0, limit)
	for rows.Next() {
		var p domain.Photo
		if err := rows.Scan(&p.ID, &p.DeviceID, &p.Lat, &p.Lng, &p.CapturedAt, &p.ImageKey, &p.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}
