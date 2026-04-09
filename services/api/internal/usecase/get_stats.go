package usecase

import "context"

type StatsRepository interface {
	CountPhotos(ctx context.Context) (int64, error)
	CountPlacements(ctx context.Context) (int64, error)
}

type GetStatsUseCase struct {
	repo StatsRepository
}

func NewGetStatsUseCase(repo StatsRepository) *GetStatsUseCase {
	return &GetStatsUseCase{repo: repo}
}

type StatsResult struct {
	PhotoCount     int64
	PlacementCount int64
}

func (uc *GetStatsUseCase) Execute(ctx context.Context) (StatsResult, error) {
	photos, err := uc.repo.CountPhotos(ctx)
	if err != nil {
		return StatsResult{}, err
	}
	placements, err := uc.repo.CountPlacements(ctx)
	if err != nil {
		return StatsResult{}, err
	}
	return StatsResult{PhotoCount: photos, PlacementCount: placements}, nil
}
