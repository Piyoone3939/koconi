package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"koconi/api/internal/usecase"
)

type PgUserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *PgUserRepository {
	return &PgUserRepository{pool: pool}
}

// UpsertByDeviceID inserts a new user or returns the existing one.
// candidateTag is only used when creating; ignored on conflict.
func (r *PgUserRepository) UpsertByDeviceID(ctx context.Context, deviceID string, candidateTag string) (usecase.User, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO users (device_id, user_tag)
		VALUES ($1, $2)
		ON CONFLICT (device_id) DO UPDATE SET device_id = EXCLUDED.device_id
		RETURNING id, device_id, display_name, user_tag, created_at
	`, deviceID, candidateTag)
	return scanUser(row)
}

func (r *PgUserRepository) FindByDeviceID(ctx context.Context, deviceID string) (usecase.User, bool, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, device_id, display_name, user_tag, created_at
		FROM users WHERE device_id = $1
	`, deviceID)
	u, err := scanUser(row)
	if err != nil {
		if isNotFound(err) {
			return usecase.User{}, false, nil
		}
		return usecase.User{}, false, err
	}
	return u, true, nil
}

func (r *PgUserRepository) FindByTag(ctx context.Context, tag string) (usecase.User, bool, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, device_id, display_name, user_tag, created_at
		FROM users WHERE user_tag = $1
	`, tag)
	u, err := scanUser(row)
	if err != nil {
		if isNotFound(err) {
			return usecase.User{}, false, nil
		}
		return usecase.User{}, false, err
	}
	return u, true, nil
}

func (r *PgUserRepository) FindByID(ctx context.Context, id int64) (usecase.User, bool, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, device_id, display_name, user_tag, created_at
		FROM users WHERE id = $1
	`, id)
	u, err := scanUser(row)
	if err != nil {
		if isNotFound(err) {
			return usecase.User{}, false, nil
		}
		return usecase.User{}, false, err
	}
	return u, true, nil
}

type scanner interface {
	Scan(dest ...any) error
}

func scanUser(row scanner) (usecase.User, error) {
	var u usecase.User
	err := row.Scan(&u.ID, &u.DeviceID, &u.DisplayName, &u.UserTag, &u.CreatedAt)
	return u, err
}

func isNotFound(err error) bool {
	return err != nil && err.Error() == "no rows in result set"
}
