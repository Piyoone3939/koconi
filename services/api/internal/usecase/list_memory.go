package usecase

import (
    "context"
    "koconi/api/internal/domain"
)

type ListMemoryUseCase struct {
    repo domain.MemoryRepository
}

func NewListMemoryUseCase(repo domain.MemoryRepository) *ListMemoryUseCase {
    return &ListMemoryUseCase{repo: repo}
}

func (u *ListMemoryUseCase) Execute(ctx context.Context) ([]domain.Memory, error) {
    return u.repo.List(ctx)
}