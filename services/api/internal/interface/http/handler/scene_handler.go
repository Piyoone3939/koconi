package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"koconi/api/internal/usecase"
)

type SceneHandler struct {
	createUC *usecase.CreateSceneUseCase
	listUC   *usecase.ListScenesUseCase
}

func NewSceneHandler(createUC *usecase.CreateSceneUseCase, listUC *usecase.ListScenesUseCase) *SceneHandler {
	return &SceneHandler{createUC: createUC, listUC: listUC}
}

// POST /v1/placements/{placementID}/scenes
func (h *SceneHandler) CreateScene(w http.ResponseWriter, r *http.Request) {
	placementID, err := strconv.ParseInt(chi.URLParam(r, "placementID"), 10, 64)
	if err != nil {
		writeBadRequest(w, "invalid placement id")
		return
	}

	var body struct {
		DeviceID  string `json:"device_id"`
		Direction string `json:"direction"`
		ImageKey  string `json:"image_key"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeBadRequest(w, "invalid json")
		return
	}

	scene, err := h.createUC.Execute(r.Context(), usecase.CreateSceneInput{
		DeviceID:    body.DeviceID,
		PlacementID: placementID,
		Direction:   body.Direction,
		ImageKey:    body.ImageKey,
	})
	if err != nil {
		if err == usecase.ErrPremiumRequired {
			writeJSON(w, http.StatusForbidden, errorResponse{OK: false, Error: err.Error()})
			return
		}
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"ok": true, "scene": scene})
}

// GET /v1/placements/{placementID}/scenes
func (h *SceneHandler) ListScenes(w http.ResponseWriter, r *http.Request) {
	placementID, err := strconv.ParseInt(chi.URLParam(r, "placementID"), 10, 64)
	if err != nil {
		writeBadRequest(w, "invalid placement id")
		return
	}

	deviceID := r.URL.Query().Get("device_id")
	if deviceID == "" {
		writeBadRequest(w, "device_id is required")
		return
	}

	scenes, err := h.listUC.Execute(r.Context(), deviceID, placementID)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "scenes": scenes})
}
