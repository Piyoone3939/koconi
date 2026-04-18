package usecase

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
	"time"
)

type User struct {
	ID          int64
	DeviceID    string
	DisplayName string
	UserTag     string
	IsPremium   bool
	CreatedAt   time.Time
}

type UserRepository interface {
	UpsertByDeviceID(ctx context.Context, deviceID string, candidateTag string) (User, error)
	FindByDeviceID(ctx context.Context, deviceID string) (User, bool, error)
	FindByTag(ctx context.Context, tag string) (User, bool, error)
	FindByID(ctx context.Context, id int64) (User, bool, error)
	UpdateDisplayName(ctx context.Context, id int64, displayName string) (User, error)
	SetPremium(ctx context.Context, id int64, isPremium bool) (User, error)
}

type RegisterUserUseCase struct {
	repo UserRepository
}

func NewRegisterUserUseCase(repo UserRepository) *RegisterUserUseCase {
	return &RegisterUserUseCase{repo: repo}
}

func (uc *RegisterUserUseCase) Execute(ctx context.Context, deviceID string) (User, error) {
	tag, err := generateUserTag()
	if err != nil {
		return User{}, fmt.Errorf("generate user tag: %w", err)
	}
	return uc.repo.UpsertByDeviceID(ctx, deviceID, tag)
}

const tagChars = "abcdefghijklmnopqrstuvwxyz0123456789"

func generateUserTag() (string, error) {
	const length = 8
	var sb strings.Builder
	sb.WriteString("@koconi_")
	for i := 0; i < length; i++ {
		idx, err := rand.Int(rand.Reader, big.NewInt(int64(len(tagChars))))
		if err != nil {
			return "", err
		}
		sb.WriteByte(tagChars[idx.Int64()])
	}
	return sb.String(), nil
}
