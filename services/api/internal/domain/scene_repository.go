package domain

import "context"

type SceneRepository interface {
	Create(ctx context.Context, scene PlacementScene) (PlacementScene, error)
	ListByPlacementID(ctx context.Context, placementID int64) ([]PlacementScene, error)
}
