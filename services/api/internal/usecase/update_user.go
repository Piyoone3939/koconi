package usecase

import (
	"context"
	"errors"
)

type UpdateUserUseCase struct {
	repo UserRepository
}

func NewUpdateUserUseCase(repo UserRepository) *UpdateUserUseCase {
	return &UpdateUserUseCase{repo: repo}
}

func (uc *UpdateUserUseCase) Execute(ctx context.Context, deviceID string, userID int64, displayName string) (User, error) {
	if displayName == "" {
		return User{}, errors.New("display_name is required")
	}

	// リクエスト送信者が対象ユーザー本人であることを確認
	requester, ok, err := uc.repo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return User{}, err
	}
	if !ok {
		return User{}, errors.New("user not found")
	}
	if requester.ID != userID {
		return User{}, errors.New("forbidden")
	}

	return uc.repo.UpdateDisplayName(ctx, userID, displayName)
}
