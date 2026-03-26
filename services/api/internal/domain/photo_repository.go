package domain

import (
	"context"
	"time"
)

type PhotoRepository interface {
	Create(ctx context.Context, deviceID string, lat, lng float64, capturedAt time.Time, imageKey string) (Photo, error)
	GetByID(ctx context.Context, id int64) (Photo, error)
	ListByDevice(ctx context.Context, deviceID string, limit int) ([]Photo, error)
}
