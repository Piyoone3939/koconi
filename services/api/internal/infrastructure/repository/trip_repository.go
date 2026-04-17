package repository

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"koconi/api/internal/domain"
)

type PgTripRepository struct {
	pool *pgxpool.Pool
}

func NewTripRepository(pool *pgxpool.Pool) *PgTripRepository {
	return &PgTripRepository{pool: pool}
}

func (r *PgTripRepository) Create(
	ctx context.Context,
	ownerUserID int64,
	title, description string,
	startAt, endAt *time.Time,
	privacyLevel string,
) (domain.Trip, error) {
	var t domain.Trip
	err := r.pool.QueryRow(ctx, `
		INSERT INTO trips (owner_user_id, title, description, start_at, end_at, privacy_level)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, owner_user_id, title, description, start_at, end_at, privacy_level, created_at
	`, ownerUserID, title, description, startAt, endAt, privacyLevel).Scan(
		&t.ID, &t.OwnerUserID, &t.Title, &t.Description,
		&t.StartAt, &t.EndAt, &t.PrivacyLevel, &t.CreatedAt,
	)
	return t, err
}

func (r *PgTripRepository) GetByID(ctx context.Context, id int64) (*domain.Trip, error) {
	var t domain.Trip
	err := r.pool.QueryRow(ctx, `
		SELECT id, owner_user_id, title, description, start_at, end_at, privacy_level, created_at
		FROM trips WHERE id = $1
	`, id).Scan(
		&t.ID, &t.OwnerUserID, &t.Title, &t.Description,
		&t.StartAt, &t.EndAt, &t.PrivacyLevel, &t.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &t, nil
}

func (r *PgTripRepository) ListByOwner(ctx context.Context, ownerUserID int64) ([]domain.Trip, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, owner_user_id, title, description, start_at, end_at, privacy_level, created_at
		FROM trips WHERE owner_user_id = $1
		ORDER BY created_at DESC
	`, ownerUserID)
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
