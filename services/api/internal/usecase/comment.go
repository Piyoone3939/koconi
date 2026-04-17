package usecase

import (
	"context"
	"errors"

	"koconi/api/internal/domain"
)

var validTargetTypes = map[string]bool{
	"photo":     true,
	"placement": true,
	"trip":      true,
}

// CreateCommentUseCase - コメント投稿
type CreateCommentUseCase struct {
	userRepo    UserRepository
	commentRepo domain.CommentRepository
}

func NewCreateCommentUseCase(userRepo UserRepository, commentRepo domain.CommentRepository) *CreateCommentUseCase {
	return &CreateCommentUseCase{userRepo: userRepo, commentRepo: commentRepo}
}

func (uc *CreateCommentUseCase) Execute(ctx context.Context, deviceID, targetType string, targetID int64, body string) (domain.Comment, error) {
	if body == "" {
		return domain.Comment{}, errors.New("body is required")
	}
	if !validTargetTypes[targetType] {
		return domain.Comment{}, errors.New("invalid target_type")
	}

	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return domain.Comment{}, err
	}
	if !ok {
		return domain.Comment{}, errors.New("user not found")
	}

	return uc.commentRepo.Create(ctx, user.ID, targetType, targetID, body)
}

// ListCommentsUseCase - コメント一覧取得
type ListCommentsUseCase struct {
	commentRepo domain.CommentRepository
}

func NewListCommentsUseCase(commentRepo domain.CommentRepository) *ListCommentsUseCase {
	return &ListCommentsUseCase{commentRepo: commentRepo}
}

func (uc *ListCommentsUseCase) Execute(ctx context.Context, targetType string, targetID int64) ([]domain.Comment, error) {
	if !validTargetTypes[targetType] {
		return nil, errors.New("invalid target_type")
	}
	return uc.commentRepo.ListByTarget(ctx, targetType, targetID)
}

// DeleteCommentUseCase - コメント削除（投稿者本人のみ）
type DeleteCommentUseCase struct {
	userRepo    UserRepository
	commentRepo domain.CommentRepository
}

func NewDeleteCommentUseCase(userRepo UserRepository, commentRepo domain.CommentRepository) *DeleteCommentUseCase {
	return &DeleteCommentUseCase{userRepo: userRepo, commentRepo: commentRepo}
}

func (uc *DeleteCommentUseCase) Execute(ctx context.Context, deviceID string, commentID int64) error {
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return err
	}
	if !ok {
		return errors.New("user not found")
	}
	return uc.commentRepo.Delete(ctx, commentID, user.ID)
}
