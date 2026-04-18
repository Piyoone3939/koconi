package usecase

import (
	"context"
	"errors"
	"time"

	"koconi/api/internal/domain"
)

// CreateTripUseCase - 旅行記録を作成する
type CreateTripUseCase struct {
	userRepo UserRepository
	tripRepo domain.TripRepository
}

func NewCreateTripUseCase(userRepo UserRepository, tripRepo domain.TripRepository) *CreateTripUseCase {
	return &CreateTripUseCase{userRepo: userRepo, tripRepo: tripRepo}
}

func (uc *CreateTripUseCase) Execute(
	ctx context.Context,
	deviceID string,
	title, description string,
	startAt, endAt *time.Time,
	privacyLevel string,
) (domain.Trip, error) {
	if title == "" {
		return domain.Trip{}, errors.New("title is required")
	}
	if privacyLevel == "" {
		privacyLevel = "private"
	}

	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return domain.Trip{}, err
	}
	if !ok {
		return domain.Trip{}, errors.New("user not found")
	}

	return uc.tripRepo.Create(ctx, user.ID, title, description, startAt, endAt, privacyLevel)
}

// GetTripUseCase - 旅行記録を取得する
type GetTripUseCase struct {
	userRepo UserRepository
	tripRepo domain.TripRepository
}

func NewGetTripUseCase(userRepo UserRepository, tripRepo domain.TripRepository) *GetTripUseCase {
	return &GetTripUseCase{userRepo: userRepo, tripRepo: tripRepo}
}

func (uc *GetTripUseCase) Execute(ctx context.Context, deviceID string, tripID int64) (domain.Trip, error) {
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return domain.Trip{}, err
	}
	if !ok {
		return domain.Trip{}, errors.New("user not found")
	}

	trip, err := uc.tripRepo.GetByID(ctx, tripID)
	if err != nil {
		return domain.Trip{}, err
	}
	if trip == nil {
		return domain.Trip{}, errors.New("trip not found")
	}
	if trip.OwnerUserID != user.ID {
		return domain.Trip{}, errors.New("forbidden")
	}
	return *trip, nil
}

// UpdateTripUseCase - 旅行記録を更新する
type UpdateTripUseCase struct {
	userRepo UserRepository
	tripRepo domain.TripRepository
}

func NewUpdateTripUseCase(userRepo UserRepository, tripRepo domain.TripRepository) *UpdateTripUseCase {
	return &UpdateTripUseCase{userRepo: userRepo, tripRepo: tripRepo}
}

func (uc *UpdateTripUseCase) Execute(ctx context.Context, deviceID string, tripID int64, title, description string, startAt, endAt *time.Time, privacyLevel string) (domain.Trip, error) {
	if title == "" {
		return domain.Trip{}, errors.New("title is required")
	}
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return domain.Trip{}, err
	}
	if !ok {
		return domain.Trip{}, errors.New("user not found")
	}
	trip, err := uc.tripRepo.GetByID(ctx, tripID)
	if err != nil {
		return domain.Trip{}, err
	}
	if trip == nil {
		return domain.Trip{}, errors.New("trip not found")
	}
	if trip.OwnerUserID != user.ID {
		return domain.Trip{}, errors.New("forbidden")
	}
	return uc.tripRepo.Update(ctx, tripID, title, description, startAt, endAt, privacyLevel)
}

// DeleteTripUseCase - 旅行記録を削除する
type DeleteTripUseCase struct {
	userRepo UserRepository
	tripRepo domain.TripRepository
}

func NewDeleteTripUseCase(userRepo UserRepository, tripRepo domain.TripRepository) *DeleteTripUseCase {
	return &DeleteTripUseCase{userRepo: userRepo, tripRepo: tripRepo}
}

func (uc *DeleteTripUseCase) Execute(ctx context.Context, deviceID string, tripID int64) error {
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return err
	}
	if !ok {
		return errors.New("user not found")
	}
	trip, err := uc.tripRepo.GetByID(ctx, tripID)
	if err != nil {
		return err
	}
	if trip == nil {
		return errors.New("trip not found")
	}
	if trip.OwnerUserID != user.ID {
		return errors.New("forbidden")
	}
	return uc.tripRepo.Delete(ctx, tripID)
}

// ListTripsUseCase - 自分の旅行記録一覧を取得する
type ListTripsUseCase struct {
	userRepo UserRepository
	tripRepo domain.TripRepository
}

func NewListTripsUseCase(userRepo UserRepository, tripRepo domain.TripRepository) *ListTripsUseCase {
	return &ListTripsUseCase{userRepo: userRepo, tripRepo: tripRepo}
}

func (uc *ListTripsUseCase) Execute(ctx context.Context, deviceID string) ([]domain.Trip, error) {
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return []domain.Trip{}, nil
	}
	return uc.tripRepo.ListByOwner(ctx, user.ID)
}
