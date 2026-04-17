package domain

import "context"

type CommentRepository interface {
	Create(ctx context.Context, userID int64, targetType string, targetID int64, body string) (Comment, error)
	ListByTarget(ctx context.Context, targetType string, targetID int64) ([]Comment, error)
	Delete(ctx context.Context, id int64, userID int64) error
}
