package handler

import (
	"encoding/json"
	"net/http"
)

type errorResponse struct {
	OK    bool
	Error string
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeBadRequest(w http.ResponseWriter, msg string) {
	writeJSON(w, http.StatusBadRequest, errorResponse{OK: false, Error: msg})
}

func writeNotFound(w http.ResponseWriter, msg string) {
	writeJSON(w, http.StatusNotFound, errorResponse{OK: false, Error: msg})
}

func writeUpstreamError(w http.ResponseWriter, msg string) {
	writeJSON(w, http.StatusBadGateway, errorResponse{OK: false, Error: msg})
}

func writeInternalError(w http.ResponseWriter, msg string) {
	writeJSON(w, http.StatusInternalServerError, errorResponse{OK: false, Error: msg})
}
