package domain

import (
	"context"
	"time"
)

type TripRepository interface {
	Create(ctx context.Context, ownerUserID int64, title, description string, startAt, endAt *time.Time, privacyLevel string) (Trip, error)
	GetByID(ctx context.Context, id int64) (*Trip, error)
	ListByOwner(ctx context.Context, ownerUserID int64) ([]Trip, error)
	Update(ctx context.Context, id int64, title, description string, startAt, endAt *time.Time, privacyLevel string) (Trip, error)
	Delete(ctx context.Context, id int64) error
}
