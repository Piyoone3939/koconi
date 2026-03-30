package domain

import "context"

type AIClient interface {
	// 既存: 類似画像マッチング
	Match(ctx context.Context, image []byte, lat, lng *float64, k int) (AIMatchResult, error)

	// 非同期3Dモデル生成: ジョブを開始してjob_idを返す
	StartGenerate3DModel(ctx context.Context, image []byte, taste string) (jobID string, err error)

	// 3Dモデル生成ジョブのステータス取得
	GetGenerate3DModelStatus(ctx context.Context, jobID string) (AI3DJobStatus, error)
}

// 3Dモデル生成ジョブのステータス
type AI3DJobStatus struct {
	Status   string `json:"status"` // "pending", "processing", "done", "failed", "not_found"
	ModelURL string `json:"model_url"`
	Error    string `json:"error"`
}
