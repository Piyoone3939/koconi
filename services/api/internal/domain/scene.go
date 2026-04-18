package domain

import "time"

type PlacementScene struct {
	ID          int64     `json:"id"`
	PlacementID int64     `json:"placement_id"`
	UserID      int64     `json:"user_id"`
	Direction   string    `json:"direction"` // N, E, S, W
	ImageKey    string    `json:"image_key"`
	CreatedAt   time.Time `json:"created_at"`
}
