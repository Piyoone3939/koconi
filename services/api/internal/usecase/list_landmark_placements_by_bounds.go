package usecase

import (
	"context"
	"errors"

	"koconi/api/internal/domain"
)

type ListLandmarkPlacementsByBoundsUseCase struct {
	repo domain.LandmarkPlacementRepository
}

func NewListLandmarkPlacementsByBoundsUseCase(
	repo domain.LandmarkPlacementRepository,
) *ListLandmarkPlacementsByBoundsUseCase {
	return &ListLandmarkPlacementsByBoundsUseCase{repo: repo}
}

func (u *ListLandmarkPlacementsByBoundsUseCase) Execute(
	ctx context.Context,
	minLat, maxLat, minLng, maxLng float64,
	limit int,
) ([]domain.LandmarkPlacement, error) {
	if minLat > maxLat {
		return nil, errors.New("min_lat must be less than or equal to max_lat")
	}
	if minLng > maxLng {
		return nil, errors.New("min_lng must be less than or equal to max_lng")
	}
	if minLat < -90 || maxLat > 90 {
		return nil, errors.New("lat bounds are out of range")
	}
	if minLng < -180 || maxLng > 180 {
		return nil, errors.New("lng bounds are out of range")
	}
	if limit <= 0 {
		limit = 100
	}
	if limit > 500 {
		limit = 500
	}

	return u.repo.ListByBounds(ctx, minLat, maxLat, minLng, maxLng, limit)
}
