package handler

import (
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	"koconi/api/internal/infrastructure/storage"
)

type UploadHandler struct {
	store *storage.LocalStorage
}

func NewUploadHandler(store *storage.LocalStorage) *UploadHandler {
	return &UploadHandler{store: store}
}

// POST /v1/upload
func (h *UploadHandler) Upload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeBadRequest(w, "multipart parse failed")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeBadRequest(w, "file field is required")
		return
	}
	defer file.Close()

	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".bin"
	}
	key := fmt.Sprintf("uploads/%d%s", time.Now().UnixNano(), ext)

	if err := h.store.Save(key, file); err != nil {
		writeInternalError(w, "save failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "key": key})
}

// GET /v1/images/{key}
func (h *UploadHandler) ServeImage(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "*")
	if key == "" {
		writeBadRequest(w, "key is required")
		return
	}

	f, err := h.store.Open(key)
	if err != nil {
		if os.IsNotExist(err) {
			writeNotFound(w, "image not found")
			return
		}
		writeInternalError(w, err.Error())
		return
	}
	defer f.Close()

	ctype := mime.TypeByExtension(filepath.Ext(key))
	if ctype == "" {
		ctype = "application/octet-stream"
	}
	w.Header().Set("Content-Type", ctype)
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	io.Copy(w, f) //nolint:errcheck
}
