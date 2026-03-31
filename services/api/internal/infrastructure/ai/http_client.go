package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"strconv"
	"time"

	"koconi/api/internal/domain"
)

type HTTPClient struct {
	baseURL    string // /match 用
	jobs3dURL  string // /jobs 用（Colab等の外部GPU）
	client     *http.Client
}

func NewHTTPClient(baseURL, jobs3dURL string) *HTTPClient {
	if jobs3dURL == "" {
		jobs3dURL = baseURL
	}
	return &HTTPClient{
		baseURL:   baseURL,
		jobs3dURL: jobs3dURL,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *HTTPClient) Match(ctx context.Context, image []byte, lat, lng *float64, k int) (domain.AIMatchResult, error) {
	var body bytes.Buffer
	w := multipart.NewWriter(&body)

	fw, err := w.CreateFormFile("file", "photo.jpg")
	if err != nil {
		return domain.AIMatchResult{}, err
	}
	if _, err := fw.Write(image); err != nil {
		return domain.AIMatchResult{}, err
	}

	if lat != nil {
		_ = w.WriteField("lat", strconv.FormatFloat(*lat, 'f', -1, 64))
	}
	if lng != nil {
		_ = w.WriteField("lng", strconv.FormatFloat(*lng, 'f', -1, 64))
	}
	_ = w.WriteField("k", strconv.Itoa(k))

	if err := w.Close(); err != nil {
		return domain.AIMatchResult{}, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/match", &body)
	if err != nil {
		return domain.AIMatchResult{}, err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())

	res, err := c.client.Do(req)
	if err != nil {
		return domain.AIMatchResult{}, err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		return domain.AIMatchResult{}, fmt.Errorf("ai match failed: status=%d", res.StatusCode)
	}

	var out domain.AIMatchResult
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return domain.AIMatchResult{}, err
	}
	return out, nil
}

// StartGenerate3DModel: POST /jobs でジョブを開始し、job_idを返す
func (c *HTTPClient) StartGenerate3DModel(ctx context.Context, image []byte, taste string) (string, error) {
	var body bytes.Buffer
	w := multipart.NewWriter(&body)

	fw, err := w.CreateFormFile("file", "photo.jpg")
	if err != nil {
		return "", err
	}
	if _, err := fw.Write(image); err != nil {
		return "", err
	}
	_ = w.WriteField("taste", taste)

	if err := w.Close(); err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.jobs3dURL+"/jobs", &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())

	res, err := c.client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		return "", fmt.Errorf("start_generate_3d_model failed: status=%d", res.StatusCode)
	}

	var out struct {
		JobID string `json:"job_id"`
	}
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return "", err
	}
	if out.JobID == "" {
		return "", fmt.Errorf("start_generate_3d_model: empty job_id in response")
	}
	return out.JobID, nil
}

// GetGenerate3DModelStatus: GET /jobs/{jobID} でジョブステータスを取得
func (c *HTTPClient) GetGenerate3DModelStatus(ctx context.Context, jobID string) (domain.AI3DJobStatus, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.jobs3dURL+"/jobs/"+jobID, nil)
	if err != nil {
		return domain.AI3DJobStatus{}, err
	}

	res, err := c.client.Do(req)
	if err != nil {
		return domain.AI3DJobStatus{}, err
	}
	defer res.Body.Close()

	var out domain.AI3DJobStatus
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return domain.AI3DJobStatus{}, err
	}
	return out, nil
}
