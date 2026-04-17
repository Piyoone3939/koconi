package usecase

import (
	"context"
	"errors"
)

type GetUserUseCase struct {
	repo UserRepository
}

func NewGetUserUseCase(repo UserRepository) *GetUserUseCase {
	return &GetUserUseCase{repo: repo}
}

func (uc *GetUserUseCase) Execute(ctx context.Context, userID int64) (User, error) {
	user, ok, err := uc.repo.FindByID(ctx, userID)
	if err != nil {
		return User{}, err
	}
	if !ok {
		return User{}, errors.New("user not found")
	}
	return user, nil
}
