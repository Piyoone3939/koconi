package domain

import "time"

type Trip struct {
	ID           int64      `json:"id"`
	OwnerUserID  int64      `json:"owner_user_id"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	StartAt      *time.Time `json:"start_at"`
	EndAt        *time.Time `json:"end_at"`
	PrivacyLevel string     `json:"privacy_level"`
	CreatedAt    time.Time  `json:"created_at"`
}
