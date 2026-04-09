package domain

import (
	"context"
	"time"
)

type SharedMap struct {
	ID          int64
	Name        string
	OwnerUserID int64
	CreatedAt   time.Time
}

type SharedMapRepository interface {
	Create(ctx context.Context, name string, ownerUserID int64) (SharedMap, error)
	ListByUserID(ctx context.Context, userID int64) ([]SharedMap, error)
	FindByID(ctx context.Context, mapID int64) (*SharedMap, error)
	AddMember(ctx context.Context, mapID, userID int64) error
	AddPlacement(ctx context.Context, mapID, placementID, addedByUserID int64) error
	ListPlacements(ctx context.Context, mapID int64) ([]LandmarkPlacement, error)
	IsMember(ctx context.Context, mapID, userID int64) (bool, error)
}
