package domain

import "time"

type Memory struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}
