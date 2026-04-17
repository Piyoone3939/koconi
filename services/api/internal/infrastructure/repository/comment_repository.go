package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"koconi/api/internal/domain"
)

type PgCommentRepository struct {
	pool *pgxpool.Pool
}

func NewCommentRepository(pool *pgxpool.Pool) *PgCommentRepository {
	return &PgCommentRepository{pool: pool}
}

func (r *PgCommentRepository) Create(ctx context.Context, userID int64, targetType string, targetID int64, body string) (domain.Comment, error) {
	var c domain.Comment
	err := r.pool.QueryRow(ctx, `
		INSERT INTO comments (user_id, target_type, target_id, body)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, target_type, target_id, body, created_at
	`, userID, targetType, targetID, body).Scan(
		&c.ID, &c.UserID, &c.TargetType, &c.TargetID, &c.Body, &c.CreatedAt,
	)
	if err != nil {
		return domain.Comment{}, err
	}
	// display_name を別クエリで取得
	_ = r.pool.QueryRow(ctx, `SELECT display_name FROM users WHERE id = $1`, userID).Scan(&c.DisplayName)
	return c, nil
}

func (r *PgCommentRepository) ListByTarget(ctx context.Context, targetType string, targetID int64) ([]domain.Comment, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT c.id, c.user_id, COALESCE(u.display_name, ''), c.target_type, c.target_id, c.body, c.created_at
		FROM comments c
		LEFT JOIN users u ON u.id = c.user_id
		WHERE c.target_type = $1 AND c.target_id = $2
		ORDER BY c.created_at ASC
	`, targetType, targetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]domain.Comment, 0)
	for rows.Next() {
		var c domain.Comment
		if err := rows.Scan(&c.ID, &c.UserID, &c.DisplayName, &c.TargetType, &c.TargetID, &c.Body, &c.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *PgCommentRepository) Delete(ctx context.Context, id int64, userID int64) error {
	tag, err := r.pool.Exec(ctx, `
		DELETE FROM comments WHERE id = $1 AND user_id = $2
	`, id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errors.New("comment not found or forbidden")
	}
	return nil
}

// pgx の ErrNoRows チェックを再利用
var _ = pgx.ErrNoRows
