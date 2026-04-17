package handler

import (
	"net/http"
	"strings"

	"koconi/api/internal/usecase"
)

type SearchHandler struct {
	searchUC *usecase.SearchUseCase
}

func NewSearchHandler(searchUC *usecase.SearchUseCase) *SearchHandler {
	return &SearchHandler{searchUC: searchUC}
}

// GET /v1/search?query=<text>&type=user,trip,placement&device_id=<id>
func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		writeBadRequest(w, "query is required")
		return
	}

	deviceID := r.URL.Query().Get("device_id")

	var types []string
	if raw := r.URL.Query().Get("type"); raw != "" {
		for _, t := range strings.Split(raw, ",") {
			if trimmed := strings.TrimSpace(t); trimmed != "" {
				types = append(types, trimmed)
			}
		}
	}

	result, err := h.searchUC.Execute(r.Context(), deviceID, query, types)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "result": result})
}
