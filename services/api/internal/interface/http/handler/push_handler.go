package handler

import (
	"encoding/json"
	"net/http"

	"koconi/api/internal/usecase"
)

type PushHandler struct {
	registerUC *usecase.RegisterPushTokenUseCase
}

func NewPushHandler(registerUC *usecase.RegisterPushTokenUseCase) *PushHandler {
	return &PushHandler{registerUC: registerUC}
}

// POST /v1/push/register
func (h *PushHandler) Register(w http.ResponseWriter, r *http.Request) {
	var body struct {
		DeviceID string `json:"device_id"`
		Token    string `json:"token"`
		Platform string `json:"platform"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeBadRequest(w, "invalid json")
		return
	}
	if body.Platform == "" {
		body.Platform = "ios"
	}

	if err := h.registerUC.Execute(r.Context(), body.DeviceID, body.Token, body.Platform); err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}
