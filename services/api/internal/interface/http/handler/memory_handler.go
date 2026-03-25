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
    writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *MemoryHandler) CreateMemory(w http.ResponseWriter, r *http.Request) {
    var req createMemoryRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "error": "invalid json"})
        return
    }

    m, err := h.createUC.Execute(r.Context(), req.Title, req.Description)
    if err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]any{"ok": false, "error": "Failed to create memory"})
        return
    }

    writeJSON(w, http.StatusOK, map[string]any{"ok": true, "memory": m})
}

func (h *MemoryHandler) ListMemory(w http.ResponseWriter, r *http.Request) {
    ms, err := h.listUC.Execute(r.Context())
    if err != nil {
        writeJSON(w, http.StatusInternalServerError, map[string]any{"ok": false, "error": "Failed to fetch memories"})
        return
    }
    writeJSON(w, http.StatusOK, ms)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    _ = json.NewEncoder(w).Encode(v)
}