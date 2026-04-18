package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PgPushTokenRepository struct {
	pool *pgxpool.Pool
}

func NewPushTokenRepository(pool *pgxpool.Pool) *PgPushTokenRepository {
	return &PgPushTokenRepository{pool: pool}
}

func (r *PgPushTokenRepository) Upsert(ctx context.Context, userID int64, token, platform string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO push_tokens (user_id, token, platform)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, token) DO NOTHING
	`, userID, token, platform)
	return err
}

func (r *PgPushTokenRepository) ListByUserID(ctx context.Context, userID int64) ([]string, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT token FROM push_tokens WHERE user_id = $1
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tokens []string
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			return nil, err
		}
		tokens = append(tokens, t)
	}
	return tokens, rows.Err()
}

func (r *PgPushTokenRepository) Delete(ctx context.Context, userID int64, token string) error {
	_, err := r.pool.Exec(ctx, `
		DELETE FROM push_tokens WHERE user_id = $1 AND token = $2
	`, userID, token)
	return err
}
