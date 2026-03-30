package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"koconi/api/internal/usecase"
)

type Photo3DStatusHandler struct {
	uc *usecase.GetPhoto3DStatusUseCase
}

func NewPhoto3DStatusHandler(uc *usecase.GetPhoto3DStatusUseCase) *Photo3DStatusHandler {
	return &Photo3DStatusHandler{uc: uc}
}

func (h *Photo3DStatusHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	photoIDStr := chi.URLParam(r, "photoID")
	photoID, err := strconv.ParseInt(photoIDStr, 10, 64)
	if err != nil {
		writeBadRequest(w, "invalid photoID")
		return
	}

	status, err := h.uc.Execute(r.Context(), photoID)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":           true,
		"status":       status.Status,
		"model_url":    status.ModelURL,
		"placement_id": status.PlacementID,
	})
}
