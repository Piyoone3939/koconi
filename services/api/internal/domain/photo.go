package domain

import "time"

type Photo struct {
	ID         int64     `json:"id"`
	DeviceID   string    `json:"device_id"`
	Lat        float64   `json:"lat"`
	Lng        float64   `json:"lng"`
	CapturedAt time.Time `json:"captured_at"`
	ImageKey   string    `json:"image_key"`
	AIJobID    string    `json:"ai_job_id"`
	CreatedAt  time.Time `json:"created_at"`
}
