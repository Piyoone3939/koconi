package usecase

import (
	"context"
	"errors"
	"time"

	"koconi/api/internal/domain"
)

type CreatePhotoUseCase struct {
	repo     domain.PhotoRepository
	aiClient domain.AIClient
}

func NewCreatePhotoUseCase(
	repo domain.PhotoRepository,
	aiClient domain.AIClient,
) *CreatePhotoUseCase {
	return &CreatePhotoUseCase{
		repo:     repo,
		aiClient: aiClient,
	}
}

func (u *CreatePhotoUseCase) Execute(
	ctx context.Context,
	deviceID string,
	lat, lng float64,
	capturedAt time.Time,
	imageKey string,
	imageBytes []byte, // nilの場合はAI処理をスキップ
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

	// 1. 写真DB登録
	photo, err := u.repo.Create(ctx, deviceID, lat, lng, capturedAt, imageKey)
	if err != nil {
		return domain.Photo{}, err
	}

	// 2. 画像バイナリがない場合はAI処理スキップ
	if len(imageBytes) == 0 {
		return photo, nil
	}

	// 3. 非同期AIジョブを開始（失敗時も写真登録は成功）
	jobID, err := u.aiClient.StartGenerate3DModel(ctx, imageBytes, "lowpoly")
	if err != nil {
		return photo, nil
	}

	// 4. job_idをDB保存
	if updateErr := u.repo.UpdateAIJobID(ctx, photo.ID, jobID); updateErr == nil {
		photo.AIJobID = jobID
	}

	return photo, nil
}
