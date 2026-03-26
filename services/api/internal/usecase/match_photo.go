package usecase

import (
	"context"
	"errors"

	"koconi/api/internal/domain"
)

type MatchPhotoUseCase struct {
	photoRepo domain.PhotoRepository
	aiClient  domain.AIClient
}

func NewMatchPhotoUseCase(photoRepo domain.PhotoRepository, aiClient domain.AIClient) *MatchPhotoUseCase {
	return &MatchPhotoUseCase{
		photoRepo: photoRepo,
		aiClient:  aiClient,
	}
}

func (u *MatchPhotoUseCase) Execute(
	ctx context.Context,
	photoID int64,
	image []byte,
	lat, lng *float64,
	k int,
) (domain.AIMatchResult, error) {
	if photoID <= 0 {
		return domain.AIMatchResult{}, errors.New("photo_id must be positive")
	}
	if len(image) == 0 {
		return domain.AIMatchResult{}, errors.New("image file is required")
	}
	if k <= 0 {
		k = 5
	}
	if k > 20 {
		k = 20
	}

	if _, err := u.photoRepo.GetByID(ctx, photoID); err != nil {
		return domain.AIMatchResult{}, err
	}

	return u.aiClient.Match(ctx, image, lat, lng, k)
}
