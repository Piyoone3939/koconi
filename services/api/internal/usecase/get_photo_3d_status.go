package usecase

import (
	"context"

	"koconi/api/internal/domain"
)

type Photo3DStatus struct {
	Status      string // "not_started", "pending", "processing", "done", "failed"
	ModelURL    string
	PlacementID int64
}

type GetPhoto3DStatusUseCase struct {
	photoRepo     domain.PhotoRepository
	placementRepo domain.LandmarkPlacementRepository
	aiClient      domain.AIClient
}

func NewGetPhoto3DStatusUseCase(
	photoRepo domain.PhotoRepository,
	placementRepo domain.LandmarkPlacementRepository,
	aiClient domain.AIClient,
) *GetPhoto3DStatusUseCase {
	return &GetPhoto3DStatusUseCase{
		photoRepo:     photoRepo,
		placementRepo: placementRepo,
		aiClient:      aiClient,
	}
}

func (u *GetPhoto3DStatusUseCase) Execute(ctx context.Context, photoID int64) (Photo3DStatus, error) {
	photo, err := u.photoRepo.GetByID(ctx, photoID)
	if err != nil {
		return Photo3DStatus{}, err
	}

	if photo.AIJobID == "" {
		return Photo3DStatus{Status: "not_started"}, nil
	}

	// AIジョブのステータス確認
	jobStatus, err := u.aiClient.GetGenerate3DModelStatus(ctx, photo.AIJobID)
	if err != nil {
		return Photo3DStatus{Status: "failed"}, nil
	}

	if jobStatus.Status != "done" {
		return Photo3DStatus{Status: jobStatus.Status}, nil
	}

	// 生成完了: 既存placementチェック（重複防止）
	existing, err := u.placementRepo.FindByPhotoIDWithModel(ctx, photoID)
	if err != nil {
		return Photo3DStatus{}, err
	}
	if existing != nil {
		return Photo3DStatus{
			Status:      "done",
			ModelURL:    existing.ModelURL,
			PlacementID: existing.ID,
		}, nil
	}

	// placement作成（assetIDはimageKey流用、scale=1, rotation=[0,0,0]）
	placement, err := u.placementRepo.Create(
		ctx,
		photo.ID,
		photo.ImageKey,
		photo.Lat,
		photo.Lng,
		1.0,
		[]float64{0, 0, 0},
		nil,
		jobStatus.ModelURL,
	)
	if err != nil {
		// placement作成失敗でもURLは返す
		return Photo3DStatus{Status: "done", ModelURL: jobStatus.ModelURL}, nil
	}

	return Photo3DStatus{
		Status:      "done",
		ModelURL:    placement.ModelURL,
		PlacementID: placement.ID,
	}, nil
}
