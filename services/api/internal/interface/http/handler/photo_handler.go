package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"koconi/api/internal/usecase"
)

type PhotoHandler struct {
	createUC *usecase.CreatePhotoUseCase
}

func NewPhotoHandler(c *usecase.CreatePhotoUseCase) *PhotoHandler {
	return &PhotoHandler{createUC: c}
}

type createPhotoRequest struct {
	DeviceID   string  `json:"device_id"`
	Lat        float64 `json:"lat"`
	Lng        float64 `json:"lng"`
	CapturedAt string  `json:"captured_at"`
	ImageKey   string  `json:"image_key"`
}

func (h *PhotoHandler) CreatePhoto(w http.ResponseWriter, r *http.Request) {
	var (
		deviceID   string
		lat, lng   float64
		capturedAt time.Time
		imageKey   string
		imageBytes []byte
		err        error
	)

	// multipart を優先して試みる（Content-Type ヘッダーに依存しない）
	if merr := r.ParseMultipartForm(32 << 20); merr == nil {
		deviceID = r.FormValue("device_id")
		imageKey = r.FormValue("image_key")

		if s := r.FormValue("lat"); s != "" {
			lat, err = strconv.ParseFloat(s, 64)
			if err != nil {
				writeBadRequest(w, "invalid lat")
				return
			}
		}
		if s := r.FormValue("lng"); s != "" {
			lng, err = strconv.ParseFloat(s, 64)
			if err != nil {
				writeBadRequest(w, "invalid lng")
				return
			}
		}
		if s := r.FormValue("captured_at"); s != "" {
			capturedAt, err = time.Parse(time.RFC3339, s)
			if err != nil {
				writeBadRequest(w, "captured_at must be RFC3339")
				return
			}
		}

		// 画像ファイル（nilでもOK: AI処理はスキップされる）
		if file, _, ferr := r.FormFile("file"); ferr == nil {
			defer file.Close()
			imageBytes, _ = io.ReadAll(file)
		}
	} else {
		// JSON形式（後方互換）
		var req createPhotoRequest
		if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeBadRequest(w, "invalid json")
			return
		}
		deviceID = req.DeviceID
		lat = req.Lat
		lng = req.Lng
		imageKey = req.ImageKey
		capturedAt, err = time.Parse(time.RFC3339, req.CapturedAt)
		if err != nil {
			writeBadRequest(w, "captured_at must be RFC3339")
			return
		}
	}

	photo, err := h.createUC.Execute(
		r.Context(),
		deviceID,
		lat,
		lng,
		capturedAt,
		imageKey,
		imageBytes,
	)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "photo": photo})
}
