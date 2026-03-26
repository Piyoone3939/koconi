package usecase

import (
	"context"
	"errors"
	"koconi/api/internal/domain"
)

type CreateMemoryUseCase struct {
	repo domain.MemoryRepository
}

func NewCreateMemoryUseCase(repo domain.MemoryRepository) *CreateMemoryUseCase {
	return &CreateMemoryUseCase{repo: repo}
}

func (u *CreateMemoryUseCase) Execute(ctx context.Context, title string, description *string) (domain.Memory, error) {
	if title == "" {
		return domain.Memory{}, errors.New("title is required")
	}
	return u.repo.Create(ctx, title, description)
}
