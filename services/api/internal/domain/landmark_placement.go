package domain

import "time"

type LandmarkPlacement struct {
	ID         int64
	PhotoID    int64
	AssetID    string
	Lat        float64
	Lng        float64
	Scale      float64
	Rotation   []float64
	MatchScore *float64
	CreatedAt  time.Time
}
