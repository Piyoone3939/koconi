package handler

import (
	"encoding/json"
	"net/http"
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
	var req createPhotoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeBadRequest(w, "invalid json")
		return
	}

	capturedAt, err := time.Parse(time.RFC3339, req.CapturedAt)
	if err != nil {
		writeBadRequest(w, "captured_at must be RFC3339")
		return
	}

	photo, err := h.createUC.Execute(
		r.Context(),
		req.DeviceID,
		req.Lat,
		req.Lng,
		capturedAt,
		req.ImageKey,
	)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "photo": photo})
}
