package domain

import "context"

type AIClient interface {
	Match(ctx context.Context, image []byte, lat, lng *float64, k int) (AIMatchResult, error)
}
