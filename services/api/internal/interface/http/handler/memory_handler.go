package handler

import (
	"encoding/json"
	"net/http"

	"koconi/api/internal/usecase"
)

type MemoryHandler struct {
	createUC *usecase.CreateMemoryUseCase
	listUC   *usecase.ListMemoryUseCase
}

func NewMemoryHandler(c *usecase.CreateMemoryUseCase, l *usecase.ListMemoryUseCase) *MemoryHandler {
	return &MemoryHandler{createUC: c, listUC: l}
}

type createMemoryRequest struct {
	Title       string  `json:"title"`
	Description *string `json:"description"`
}

func (h *MemoryHandler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "status": "ok"})
}

func (h *MemoryHandler) CreateMemory(w http.ResponseWriter, r *http.Request) {
	var req createMemoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeBadRequest(w, "invalid json")
		return
	}

	m, err := h.createUC.Execute(r.Context(), req.Title, req.Description)
	if err != nil {
		writeInternalError(w, "failed to create memory")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "memory": m})
}

func (h *MemoryHandler) ListMemory(w http.ResponseWriter, r *http.Request) {
	ms, err := h.listUC.Execute(r.Context())
	if err != nil {
		writeInternalError(w, "failed to fetch memories")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "memories": ms})
}
