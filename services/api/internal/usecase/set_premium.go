package usecase

import (
	"context"
	"errors"
)

type SetPremiumUseCase struct {
	repo UserRepository
}

func NewSetPremiumUseCase(repo UserRepository) *SetPremiumUseCase {
	return &SetPremiumUseCase{repo: repo}
}

func (uc *SetPremiumUseCase) Execute(ctx context.Context, deviceID string, userID int64, isPremium bool) (User, error) {
	caller, ok, err := uc.repo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return User{}, err
	}
	if !ok {
		return User{}, errors.New("user not found")
	}
	if caller.ID != userID {
		return User{}, errors.New("forbidden")
	}
	return uc.repo.SetPremium(ctx, userID, isPremium)
}
