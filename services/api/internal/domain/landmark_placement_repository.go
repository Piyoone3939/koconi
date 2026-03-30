package domain

import "context"

type LandmarkPlacementRepository interface {
	Create(
		ctx context.Context,
		photoID int64,
		assetID string,
		lat, lng float64,
		scale float64,
		rotation []float64,
		matchScore *float64,
		modelURL string,
	) (LandmarkPlacement, error)

	ListByBounds(
		ctx context.Context,
		minLat, maxLat, minLng, maxLng float64,
		limit int,
	) ([]LandmarkPlacement, error)

	// 3Dモデルありのplacementを取得（重複作成防止用）
	FindByPhotoIDWithModel(ctx context.Context, photoID int64) (*LandmarkPlacement, error)
}
