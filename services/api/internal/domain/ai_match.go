package domain

type AICandidate struct {
	AssetID           string    `json:"asset_id"`
	MatchScore        float64   `json:"match_score"`
	SuggestedScale    float64   `json:"suggested_scale"`
	SuggestedRotation []float64 `json:"suggested_rotation"`
}

type AIMatchResult struct {
	Candidates []AICandidate `json:"candidates"`
}
