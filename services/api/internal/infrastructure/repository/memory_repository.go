package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"koconi/api/internal/domain"
)

type PgMemoryRepository struct {
	pool *pgxpool.Pool
}

func NewMemoryRepository(pool *pgxpool.Pool) *PgMemoryRepository {
	return &PgMemoryRepository{pool: pool}
}

func (r *PgMemoryRepository) Create(ctx context.Context, title string, description *string) (domain.Memory, error) {
	q := `
        INSERT INTO "Memory" (title, description)
        VALUES ($1, $2)
        RETURNING id, title, description, "createdAt"
    `
	var m domain.Memory
	err := r.pool.QueryRow(ctx, q, title, description).Scan(&m.ID, &m.Title, &m.Description, &m.CreatedAt)
	return m, err
}

func (r *PgMemoryRepository) List(ctx context.Context) ([]domain.Memory, error) {
	q := `
        SELECT id, title, description, "createdAt"
        FROM "Memory"
        ORDER BY "createdAt" DESC
    `
	rows, err := r.pool.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.Memory, 0)
	for rows.Next() {
		var m domain.Memory
		if err := rows.Scan(&m.ID, &m.Title, &m.Description, &m.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}
