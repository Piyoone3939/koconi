package handler

import (
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"koconi/api/internal/usecase"
)

type PhotoMatchHandler struct {
	matchUC *usecase.MatchPhotoUseCase
}

func NewPhotoMatchHandler(m *usecase.MatchPhotoUseCase) *PhotoMatchHandler {
	return &PhotoMatchHandler{matchUC: m}
}

func (h *PhotoMatchHandler) MatchPhoto(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "photoID")
	photoID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || photoID <= 0 {
		writeBadRequest(w, "invalid photoID")
		return
	}

	if err := r.ParseMultipartForm(16 << 20); err != nil {
		writeBadRequest(w, "invalid multipart form")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		writeBadRequest(w, "file is required")
		return
	}
	defer file.Close()

	buf, err := io.ReadAll(file)
	if err != nil {
		writeInternalError(w, "failed to read file")
		return
	}

	var latPtr, lngPtr *float64

	if s := r.FormValue("lat"); s != "" {
		v, e := strconv.ParseFloat(s, 64)
		if e != nil {
			writeBadRequest(w, "invalid lat")
			return
		}
		latPtr = &v
	}

	if s := r.FormValue("lng"); s != "" {
		v, e := strconv.ParseFloat(s, 64)
		if e != nil {
			writeBadRequest(w, "invalid lng")
			return
		}
		lngPtr = &v
	}

	k := 5
	if s := r.FormValue("k"); s != "" {
		v, e := strconv.Atoi(s)
		if e != nil {
			writeBadRequest(w, "invalid k")
			return
		}
		k = v
	}

	result, err := h.matchUC.Execute(r.Context(), photoID, buf, latPtr, lngPtr, k)
	if err != nil {
		switch {
		case errors.Is(err, pgx.ErrNoRows):
			writeNotFound(w, "photo not found")
		case strings.Contains(err.Error(), "ai match failed"),
			strings.Contains(err.Error(), "connection refused"),
			strings.Contains(err.Error(), "Client.Timeout"):
			writeUpstreamError(w, "ai service unavailable")
		case strings.Contains(err.Error(), "required"),
			strings.Contains(err.Error(), "invalid"),
			strings.Contains(err.Error(), "must be"):
			writeBadRequest(w, err.Error())
		default:
			writeInternalError(w, "failed to match photo")
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "result": result})
}
