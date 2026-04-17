package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"koconi/api/internal/usecase"
)

type TripHandler struct {
	createUC *usecase.CreateTripUseCase
	getUC    *usecase.GetTripUseCase
	listUC   *usecase.ListTripsUseCase
}

func NewTripHandler(
	createUC *usecase.CreateTripUseCase,
	getUC *usecase.GetTripUseCase,
	listUC *usecase.ListTripsUseCase,
) *TripHandler {
	return &TripHandler{createUC: createUC, getUC: getUC, listUC: listUC}
}

type createTripRequest struct {
	DeviceID     string  `json:"device_id"`
	Title        string  `json:"title"`
	Description  string  `json:"description"`
	StartAt      *string `json:"start_at"`
	EndAt        *string `json:"end_at"`
	PrivacyLevel string  `json:"privacy_level"`
}

func (h *TripHandler) CreateTrip(w http.ResponseWriter, r *http.Request) {
	var req createTripRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeBadRequest(w, "invalid json")
		return
	}

	var startAt, endAt *time.Time
	if req.StartAt != nil {
		t, err := time.Parse(time.RFC3339, *req.StartAt)
		if err != nil {
			writeBadRequest(w, "start_at must be RFC3339")
			return
		}
		startAt = &t
	}
	if req.EndAt != nil {
		t, err := time.Parse(time.RFC3339, *req.EndAt)
		if err != nil {
			writeBadRequest(w, "end_at must be RFC3339")
			return
		}
		endAt = &t
	}

	trip, err := h.createUC.Execute(r.Context(), req.DeviceID, req.Title, req.Description, startAt, endAt, req.PrivacyLevel)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"ok": true, "trip": trip})
}

func (h *TripHandler) GetTrip(w http.ResponseWriter, r *http.Request) {
	tripID, err := strconv.ParseInt(chi.URLParam(r, "tripID"), 10, 64)
	if err != nil {
		writeBadRequest(w, "invalid trip id")
		return
	}
	deviceID := r.URL.Query().Get("device_id")
	if deviceID == "" {
		writeBadRequest(w, "device_id is required")
		return
	}

	trip, err := h.getUC.Execute(r.Context(), deviceID, tripID)
	if err != nil {
		if err.Error() == "trip not found" {
			writeNotFound(w, err.Error())
			return
		}
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "trip": trip})
}

func (h *TripHandler) ListTrips(w http.ResponseWriter, r *http.Request) {
	deviceID := r.URL.Query().Get("device_id")
	if deviceID == "" {
		writeBadRequest(w, "device_id is required")
		return
	}

	trips, err := h.listUC.Execute(r.Context(), deviceID)
	if err != nil {
		writeInternalError(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "trips": trips})
}
