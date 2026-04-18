package usecase

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
)

type PushTokenRepository interface {
	Upsert(ctx context.Context, userID int64, token, platform string) error
	ListByUserID(ctx context.Context, userID int64) ([]string, error)
	Delete(ctx context.Context, userID int64, token string) error
}

type RegisterPushTokenUseCase struct {
	userRepo  UserRepository
	tokenRepo PushTokenRepository
}

func NewRegisterPushTokenUseCase(userRepo UserRepository, tokenRepo PushTokenRepository) *RegisterPushTokenUseCase {
	return &RegisterPushTokenUseCase{userRepo: userRepo, tokenRepo: tokenRepo}
}

func (uc *RegisterPushTokenUseCase) Execute(ctx context.Context, deviceID, token, platform string) error {
	if token == "" {
		return errors.New("token is required")
	}
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return err
	}
	if !ok {
		return errors.New("user not found")
	}
	return uc.tokenRepo.Upsert(ctx, user.ID, token, platform)
}

// SendPushNotification は Expo Push API を使って通知を送る
func SendPushNotification(tokens []string, title, body string, data map[string]any) error {
	if len(tokens) == 0 {
		return nil
	}

	type message struct {
		To    string         `json:"to"`
		Title string         `json:"title"`
		Body  string         `json:"body"`
		Data  map[string]any `json:"data,omitempty"`
	}

	messages := make([]message, 0, len(tokens))
	for _, t := range tokens {
		messages = append(messages, message{To: t, Title: title, Body: body, Data: data})
	}

	payload, err := json.Marshal(messages)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	resp, err := http.Post("https://exp.host/--/api/v2/push/send", "application/json", bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("push send: %w", err)
	}
	defer resp.Body.Close()
	return nil
}
