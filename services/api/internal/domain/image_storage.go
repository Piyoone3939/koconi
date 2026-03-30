package domain

import "context"

// 画像ストレージ取得用インターフェース
type ImageStorage interface {
	GetImage(ctx context.Context, imageKey string) ([]byte, error)
}
