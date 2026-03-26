package domain

import "context"

type MemoryRepository interface {
	Create(ctx context.Context, title string, description *string) (Memory, error)
	List(ctx context.Context) ([]Memory, error)
}
