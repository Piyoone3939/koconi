package handler

import (
	"net/http"

	"koconi/api/internal/usecase"
)

type StatsHandler struct {
	uc *usecase.GetStatsUseCase
}

func NewStatsHandler(uc *usecase.GetStatsUseCase) *StatsHandler {
	return &StatsHandler{uc: uc}
}

func (h *StatsHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	result, err := h.uc.Execute(r.Context())
	if err != nil {
		writeInternalError(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":              true,
		"photo_count":     result.PhotoCount,
		"placement_count": result.PlacementCount,
	})
}
