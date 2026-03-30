package domain

import "time"

type LandmarkPlacement struct {
	ID         int64     `json:"id"`
	PhotoID    int64     `json:"photo_id"`
	AssetID    string    `json:"asset_id"`
	Lat        float64   `json:"lat"`
	Lng        float64   `json:"lng"`
	Scale      float64   `json:"scale"`
	Rotation   []float64 `json:"rotation"`
	MatchScore *float64  `json:"match_score"`
	ModelURL   string    `json:"model_url"`
	CreatedAt  time.Time `json:"created_at"`
}
