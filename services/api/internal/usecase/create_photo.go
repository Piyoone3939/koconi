package usecase

import (
	"context"
	"errors"
	"time"

	"koconi/api/internal/domain"
)

type CreatePhotoUseCase struct {
	repo domain.PhotoRepository
}

func NewCreatePhotoUseCase(repo domain.PhotoRepository) *CreatePhotoUseCase {
	return &CreatePhotoUseCase{repo: repo}
}

func (u *CreatePhotoUseCase) Execute(
	ctx context.Context,
	deviceID string,
	lat, lng float64,
	capturedAt time.Time,
	imageKey string,
) (domain.Photo, error) {
	if deviceID == "" {
		return domain.Photo{}, errors.New("device_id is required")
	}
	if imageKey == "" {
		return domain.Photo{}, errors.New("image_key is required")
	}
	if lat < -90 || lat > 90 {
		return domain.Photo{}, errors.New("lat is out of range")
	}
	if lng < -180 || lng > 180 {
		return domain.Photo{}, errors.New("lng is out of range")
	}
	if capturedAt.IsZero() {
		return domain.Photo{}, errors.New("captured_at is required")
	}

	return u.repo.Create(ctx, deviceID, lat, lng, capturedAt, imageKey)
}
