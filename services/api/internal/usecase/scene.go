package usecase

import (
	"context"
	"errors"

	"koconi/api/internal/domain"
)

var ErrPremiumRequired = errors.New("premium subscription required")

type SceneRepository interface {
	Create(ctx context.Context, scene domain.PlacementScene) (domain.PlacementScene, error)
	ListByPlacementID(ctx context.Context, placementID int64) ([]domain.PlacementScene, error)
}

type CreateSceneUseCase struct {
	userRepo  UserRepository
	sceneRepo SceneRepository
}

func NewCreateSceneUseCase(userRepo UserRepository, sceneRepo SceneRepository) *CreateSceneUseCase {
	return &CreateSceneUseCase{userRepo: userRepo, sceneRepo: sceneRepo}
}

type CreateSceneInput struct {
	DeviceID    string
	PlacementID int64
	Direction   string
	ImageKey    string
}

func (uc *CreateSceneUseCase) Execute(ctx context.Context, in CreateSceneInput) (domain.PlacementScene, error) {
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, in.DeviceID)
	if err != nil {
		return domain.PlacementScene{}, err
	}
	if !ok {
		return domain.PlacementScene{}, errors.New("user not found")
	}
	if !user.IsPremium {
		return domain.PlacementScene{}, ErrPremiumRequired
	}

	scene := domain.PlacementScene{
		PlacementID: in.PlacementID,
		UserID:      user.ID,
		Direction:   in.Direction,
		ImageKey:    in.ImageKey,
	}
	return uc.sceneRepo.Create(ctx, scene)
}

type ListScenesUseCase struct {
	userRepo  UserRepository
	sceneRepo SceneRepository
}

func NewListScenesUseCase(userRepo UserRepository, sceneRepo SceneRepository) *ListScenesUseCase {
	return &ListScenesUseCase{userRepo: userRepo, sceneRepo: sceneRepo}
}

func (uc *ListScenesUseCase) Execute(ctx context.Context, deviceID string, placementID int64) ([]domain.PlacementScene, error) {
	_, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("user not found")
	}
	return uc.sceneRepo.ListByPlacementID(ctx, placementID)
}
