package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"koconi/api/internal/domain"
)

var (
	ErrInvalidPhotoID = errors.New("invalid photo_id")
	ErrImageRequired  = errors.New("image required")
	ErrInvalidLat     = errors.New("invalid lat")
	ErrInvalidLng     = errors.New("invalid lng")
	ErrPhotoNotFound  = errors.New("photo not found")
	ErrAIMatchFailed  = errors.New("ai match failed")
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
		return domain.AIMatchResult{}, ErrInvalidPhotoID
	}
	if len(image) == 0 {
		return domain.AIMatchResult{}, ErrImageRequired
	}
	if k <= 0 {
		k = 5
	}
	if k > 20 {
		k = 20
	}
	if lat != nil && (*lat < -90 || *lat > 90) {
		return domain.AIMatchResult{}, ErrInvalidLat
	}
	if lng != nil && (*lng < -180 || *lng > 180) {
		return domain.AIMatchResult{}, ErrInvalidLng
	}

	if _, err := u.photoRepo.GetByID(ctx, photoID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.AIMatchResult{}, ErrPhotoNotFound
		}
		return domain.AIMatchResult{}, fmt.Errorf("photoRepo.GetByID: %w", err)
	}

	result, err := u.aiClient.Match(ctx, image, lat, lng, k)
	if err != nil {
		return domain.AIMatchResult{}, errors.Join(ErrAIMatchFailed, err)
	}

	return result, nil
}
