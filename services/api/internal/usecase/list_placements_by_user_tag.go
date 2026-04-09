package usecase

import (
	"context"

	"koconi/api/internal/domain"
)

type ListPlacementsByUserTagUseCase struct {
	repo domain.LandmarkPlacementRepository
}

func NewListPlacementsByUserTagUseCase(repo domain.LandmarkPlacementRepository) *ListPlacementsByUserTagUseCase {
	return &ListPlacementsByUserTagUseCase{repo: repo}
}

func (uc *ListPlacementsByUserTagUseCase) Execute(ctx context.Context, userTag string, limit int) ([]domain.LandmarkPlacement, error) {
	if limit <= 0 {
		limit = 200
	}
	if limit > 500 {
		limit = 500
	}
	return uc.repo.ListByUserTag(ctx, userTag, limit)
}
