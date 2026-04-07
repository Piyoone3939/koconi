package usecase

import (
	"context"
	"errors"
	"time"
)

type FriendRequest struct {
	ID        int64
	FromUser  User
	ToUser    User
	Status    string
	CreatedAt time.Time
}

type FriendRequestRepository interface {
	Create(ctx context.Context, fromUserID, toUserID int64) (FriendRequest, error)
	FindByID(ctx context.Context, id int64) (FriendRequest, bool, error)
	UpdateStatus(ctx context.Context, id int64, status string) error
	ListAcceptedFriends(ctx context.Context, userID int64) ([]User, error)
	ListIncomingPending(ctx context.Context, toUserID int64) ([]FriendRequest, error)
}

// --- SendFriendRequest ---

type SendFriendRequestUseCase struct {
	userRepo   UserRepository
	friendRepo FriendRequestRepository
}

func NewSendFriendRequestUseCase(userRepo UserRepository, friendRepo FriendRequestRepository) *SendFriendRequestUseCase {
	return &SendFriendRequestUseCase{userRepo: userRepo, friendRepo: friendRepo}
}

func (uc *SendFriendRequestUseCase) Execute(ctx context.Context, fromDeviceID string, toTag string) (FriendRequest, error) {
	fromUser, ok, err := uc.userRepo.FindByDeviceID(ctx, fromDeviceID)
	if err != nil {
		return FriendRequest{}, err
	}
	if !ok {
		return FriendRequest{}, errors.New("sender not found: register first")
	}

	toUser, ok2, err := uc.userRepo.FindByTag(ctx, toTag)
	if err != nil {
		return FriendRequest{}, err
	}
	if !ok2 {
		return FriendRequest{}, errors.New("target user not found")
	}

	if fromUser.ID == toUser.ID {
		return FriendRequest{}, errors.New("cannot send request to yourself")
	}

	return uc.friendRepo.Create(ctx, fromUser.ID, toUser.ID)
}

// --- ListFriends ---

type ListFriendsUseCase struct {
	userRepo   UserRepository
	friendRepo FriendRequestRepository
}

func NewListFriendsUseCase(userRepo UserRepository, friendRepo FriendRequestRepository) *ListFriendsUseCase {
	return &ListFriendsUseCase{userRepo: userRepo, friendRepo: friendRepo}
}

func (uc *ListFriendsUseCase) Execute(ctx context.Context, deviceID string) ([]User, error) {
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return []User{}, nil
	}
	return uc.friendRepo.ListAcceptedFriends(ctx, user.ID)
}

// --- ListIncomingRequests ---

type ListIncomingRequestsUseCase struct {
	userRepo   UserRepository
	friendRepo FriendRequestRepository
}

func NewListIncomingRequestsUseCase(userRepo UserRepository, friendRepo FriendRequestRepository) *ListIncomingRequestsUseCase {
	return &ListIncomingRequestsUseCase{userRepo: userRepo, friendRepo: friendRepo}
}

func (uc *ListIncomingRequestsUseCase) Execute(ctx context.Context, deviceID string) ([]FriendRequest, error) {
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return []FriendRequest{}, nil
	}
	return uc.friendRepo.ListIncomingPending(ctx, user.ID)
}

// --- RespondFriendRequest ---

type RespondFriendRequestUseCase struct {
	userRepo   UserRepository
	friendRepo FriendRequestRepository
}

func NewRespondFriendRequestUseCase(userRepo UserRepository, friendRepo FriendRequestRepository) *RespondFriendRequestUseCase {
	return &RespondFriendRequestUseCase{userRepo: userRepo, friendRepo: friendRepo}
}

func (uc *RespondFriendRequestUseCase) Execute(ctx context.Context, deviceID string, requestID int64, accept bool) error {
	user, ok, err := uc.userRepo.FindByDeviceID(ctx, deviceID)
	if err != nil {
		return err
	}
	if !ok {
		return errors.New("user not found")
	}

	req, found, err := uc.friendRepo.FindByID(ctx, requestID)
	if err != nil {
		return err
	}
	if !found {
		return errors.New("request not found")
	}
	if req.ToUser.ID != user.ID {
		return errors.New("not authorized")
	}

	status := "rejected"
	if accept {
		status = "accepted"
	}
	return uc.friendRepo.UpdateStatus(ctx, requestID, status)
}
