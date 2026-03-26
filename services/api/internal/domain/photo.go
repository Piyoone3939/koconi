package domain

import "time"

type Photo struct {
	ID         int64
	DeviceID   string
	Lat        float64
	Lng        float64
	CapturedAt time.Time
	ImageKey   string
	CreatedAt  time.Time
}
