package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"koconi/api/internal/usecase"
)

type UserHandler struct {
	registerUC   *usecase.RegisterUserUseCase
	searchUC     *usecase.SearchUserUseCase
	getUC        *usecase.GetUserUseCase
	updateUC     *usecase.UpdateUserUseCase
	setPremiumUC *usecase.SetPremiumUseCase
}

func NewUserHandler(
	registerUC *usecase.RegisterUserUseCase,
	searchUC *usecase.SearchUserUseCase,
	getUC *usecase.GetUserUseCase,
	updateUC *usecase.UpdateUserUseCase,
	setPremiumUC *usecase.SetPremiumUseCase,
) *UserHandler {
	return &UserHandler{registerUC: registerUC, searchUC: searchUC, getUC: getUC, updateUC: updateUC, setPremiumUC: setPremiumUC}
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

// GET /v1/users/{userID}
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	userID, err := parseUserID(r)
	if err != nil {
		writeBadRequest(w, "invalid user id")
		return
	}

	user, err := h.getUC.Execute(r.Context(), userID)
	if err != nil {
		if err.Error() == "user not found" {
			writeNotFound(w, err.Error())
			return
		}
		writeInternalError(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "user": userJSON(user)})
}

// PUT /v1/users/{userID}
func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	userID, err := parseUserID(r)
	if err != nil {
		writeBadRequest(w, "invalid user id")
		return
	}

	var body struct {
		DeviceID    string `json:"device_id"`
		DisplayName string `json:"display_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeBadRequest(w, "invalid json")
		return
	}

	user, err := h.updateUC.Execute(r.Context(), body.DeviceID, userID, body.DisplayName)
	if err != nil {
		switch err.Error() {
		case "user not found":
			writeNotFound(w, err.Error())
		case "forbidden":
			writeJSON(w, http.StatusForbidden, errorResponse{OK: false, Error: err.Error()})
		default:
			writeBadRequest(w, err.Error())
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "user": userJSON(user)})
}

// PUT /v1/users/{userID}/premium
func (h *UserHandler) SetPremium(w http.ResponseWriter, r *http.Request) {
	userID, err := parseUserID(r)
	if err != nil {
		writeBadRequest(w, "invalid user id")
		return
	}

	var body struct {
		DeviceID  string `json:"device_id"`
		IsPremium bool   `json:"is_premium"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeBadRequest(w, "invalid json")
		return
	}

	user, err := h.setPremiumUC.Execute(r.Context(), body.DeviceID, userID, body.IsPremium)
	if err != nil {
		switch err.Error() {
		case "user not found":
			writeNotFound(w, err.Error())
		case "forbidden":
			writeJSON(w, http.StatusForbidden, errorResponse{OK: false, Error: err.Error()})
		default:
			writeBadRequest(w, err.Error())
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "user": userJSON(user)})
}

func parseUserID(r *http.Request) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, "userID"), 10, 64)
}

func userJSON(u usecase.User) map[string]any {
	return map[string]any{
		"id":           u.ID,
		"display_name": u.DisplayName,
		"user_tag":     u.UserTag,
		"is_premium":   u.IsPremium,
	}
}
