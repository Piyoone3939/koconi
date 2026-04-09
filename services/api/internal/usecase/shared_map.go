package usecase

import (
	"context"
	"errors"

	"koconi/api/internal/domain"
)

// CreateSharedMapUseCase - 共有マップ作成（オーナーを自動メンバー追加）
type CreateSharedMapUseCase struct {
	userRepo UserRepository
	mapRepo  domain.SharedMapRepository
}

func NewCreateSharedMapUseCase(userRepo UserRepository, mapRepo domain.SharedMapRepository) *CreateSharedMapUseCase {
	return &CreateSharedMapUseCase{userRepo: userRepo, mapRepo: mapRepo}
}

func (uc *CreateSharedMapUseCase) Execute(ctx context.Context, deviceID, name string) (domain.SharedMap, error) {
	if name == "" {
		return domain.SharedMap{}, errors.New("name is required")
	}
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return domain.SharedMap{}, err
	}
	if !ok {
		return domain.SharedMap{}, errors.New("user not found")
	}
	m, err := uc.mapRepo.Create(ctx, name, user.ID)
	if err != nil {
		return domain.SharedMap{}, err
	}
	if err := uc.mapRepo.AddMember(ctx, m.ID, user.ID); err != nil {
		return domain.SharedMap{}, err
	}
	return m, nil
}

// ListSharedMapsUseCase - ユーザーが参加している共有マップ一覧
type ListSharedMapsUseCase struct {
	userRepo UserRepository
	mapRepo  domain.SharedMapRepository
}

func NewListSharedMapsUseCase(userRepo UserRepository, mapRepo domain.SharedMapRepository) *ListSharedMapsUseCase {
	return &ListSharedMapsUseCase{userRepo: userRepo, mapRepo: mapRepo}
}

func (uc *ListSharedMapsUseCase) Execute(ctx context.Context, deviceID string) ([]domain.SharedMap, error) {
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return []domain.SharedMap{}, nil
	}
	return uc.mapRepo.ListByUserID(ctx, user.ID)
}

// AddSharedMapMemberUseCase - メンバー招待（既存メンバーのみ可能）
type AddSharedMapMemberUseCase struct {
	userRepo UserRepository
	mapRepo  domain.SharedMapRepository
}

func NewAddSharedMapMemberUseCase(userRepo UserRepository, mapRepo domain.SharedMapRepository) *AddSharedMapMemberUseCase {
	return &AddSharedMapMemberUseCase{userRepo: userRepo, mapRepo: mapRepo}
}

func (uc *AddSharedMapMemberUseCase) Execute(ctx context.Context, deviceID string, mapID int64, memberTag string) error {
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return err
	}
	if !ok {
		return errors.New("user not found")
	}
	isMember, err := uc.mapRepo.IsMember(ctx, mapID, user.ID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("not a member of this map")
	}
	newMember, ok, err := uc.userRepo.FindByTag(ctx, memberTag)
	if err != nil {
		return err
	}
	if !ok {
		return errors.New("user not found: " + memberTag)
	}
	return uc.mapRepo.AddMember(ctx, mapID, newMember.ID)
}

// AddSharedMapPlacementUseCase - placementを共有マップに追加
type AddSharedMapPlacementUseCase struct {
	userRepo UserRepository
	mapRepo  domain.SharedMapRepository
}

func NewAddSharedMapPlacementUseCase(userRepo UserRepository, mapRepo domain.SharedMapRepository) *AddSharedMapPlacementUseCase {
	return &AddSharedMapPlacementUseCase{userRepo: userRepo, mapRepo: mapRepo}
}

func (uc *AddSharedMapPlacementUseCase) Execute(ctx context.Context, deviceID string, mapID, placementID int64) error {
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return err
	}
	if !ok {
		return errors.New("user not found")
	}
	isMember, err := uc.mapRepo.IsMember(ctx, mapID, user.ID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("not a member of this map")
	}
	return uc.mapRepo.AddPlacement(ctx, mapID, placementID, user.ID)
}

// ListSharedMapPlacementsUseCase - 共有マップのplacement一覧
type ListSharedMapPlacementsUseCase struct {
	userRepo UserRepository
	mapRepo  domain.SharedMapRepository
}

func NewListSharedMapPlacementsUseCase(userRepo UserRepository, mapRepo domain.SharedMapRepository) *ListSharedMapPlacementsUseCase {
	return &ListSharedMapPlacementsUseCase{userRepo: userRepo, mapRepo: mapRepo}
}

func (uc *ListSharedMapPlacementsUseCase) Execute(ctx context.Context, deviceID string, mapID int64) ([]domain.LandmarkPlacement, error) {
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("user not found")
	}
	isMember, err := uc.mapRepo.IsMember(ctx, mapID, user.ID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("not a member of this map")
	}
	return uc.mapRepo.ListPlacements(ctx, mapID)
}
