package domain

import "time"

type Comment struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	DisplayName string   `json:"display_name"`
	TargetType string    `json:"target_type"`
	TargetID   int64     `json:"target_id"`
	Body       string    `json:"body"`
	CreatedAt  time.Time `json:"created_at"`
}
