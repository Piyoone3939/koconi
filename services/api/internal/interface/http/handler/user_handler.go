package handler

import (
	"encoding/json"
	"net/http"

	"koconi/api/internal/usecase"
)

type UserHandler struct {
	registerUC *usecase.RegisterUserUseCase
	searchUC   *usecase.SearchUserUseCase
}

func NewUserHandler(registerUC *usecase.RegisterUserUseCase, searchUC *usecase.SearchUserUseCase) *UserHandler {
	return &UserHandler{registerUC: registerUC, searchUC: searchUC}
}

// POST /v1/users/register
func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var body struct {
		DeviceID string `json:"device_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.DeviceID == "" {
		writeBadRequest(w, "device_id is required")
		return
	}

	user, err := h.registerUC.Execute(r.Context(), body.DeviceID)
	if err != nil {
		writeInternalError(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":   true,
		"user": userJSON(user),
	})
}

// GET /v1/users/search?tag=@koconi_xxx
func (h *UserHandler) Search(w http.ResponseWriter, r *http.Request) {
	tag := r.URL.Query().Get("tag")
	if tag == "" {
		writeBadRequest(w, "tag query param is required")
		return
	}

	user, found, err := h.searchUC.Execute(r.Context(), tag)
	if err != nil {
		writeInternalError(w, err.Error())
		return
	}
	if !found {
		writeNotFound(w, "user not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":   true,
		"user": userJSON(user),
	})
}

func userJSON(u usecase.User) map[string]any {
	return map[string]any{
		"id":           u.ID,
		"display_name": u.DisplayName,
		"user_tag":     u.UserTag,
	}
}
