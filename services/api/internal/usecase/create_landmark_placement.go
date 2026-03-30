package usecase

import (
	"context"
	"errors"

	"koconi/api/internal/domain"
)

type CreateLandmarkPlacementUseCase struct {
	photoRepo     domain.PhotoRepository
	placementRepo domain.LandmarkPlacementRepository
}

func NewCreateLandmarkPlacementUseCase(
	photoRepo domain.PhotoRepository,
	placementRepo domain.LandmarkPlacementRepository,
) *CreateLandmarkPlacementUseCase {
	return &CreateLandmarkPlacementUseCase{
		photoRepo:     photoRepo,
		placementRepo: placementRepo,
	}
}

func (u *CreateLandmarkPlacementUseCase) Execute(
	ctx context.Context,
	photoID int64,
	assetID string,
	lat, lng float64,
	scale float64,
	rotation []float64,
	matchScore *float64,
	modelURL string,
) (domain.LandmarkPlacement, error) {
	if photoID <= 0 {
		return domain.LandmarkPlacement{}, errors.New("photo_id must be positive")
	}
	if assetID == "" {
		return domain.LandmarkPlacement{}, errors.New("asset_id is required")
	}
	if lat < -90 || lat > 90 {
		return domain.LandmarkPlacement{}, errors.New("lat is out of range")
	}
	if lng < -180 || lng > 180 {
		return domain.LandmarkPlacement{}, errors.New("lng is out of range")
	}
	if scale <= 0 {
		return domain.LandmarkPlacement{}, errors.New("scale must be greater than 0")
	}
	if len(rotation) != 3 {
		return domain.LandmarkPlacement{}, errors.New("rotation must have 3 elements")
	}

	if _, err := u.photoRepo.GetByID(ctx, photoID); err != nil {
		return domain.LandmarkPlacement{}, err
	}

	return u.placementRepo.Create(ctx, photoID, assetID, lat, lng, scale, rotation, matchScore, modelURL)
}
