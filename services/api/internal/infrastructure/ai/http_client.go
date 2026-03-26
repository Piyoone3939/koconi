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
	baseURL string
	client  *http.Client
}

func NewHTTPClient(baseURL string) *HTTPClient {
	return &HTTPClient{
		baseURL: baseURL,
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
