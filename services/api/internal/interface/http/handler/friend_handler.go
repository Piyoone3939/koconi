package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"koconi/api/internal/usecase"
)

type FriendHandler struct {
	sendUC     *usecase.SendFriendRequestUseCase
	listUC     *usecase.ListFriendsUseCase
	incomingUC *usecase.ListIncomingRequestsUseCase
	respondUC  *usecase.RespondFriendRequestUseCase
}

func NewFriendHandler(
	sendUC *usecase.SendFriendRequestUseCase,
	listUC *usecase.ListFriendsUseCase,
	incomingUC *usecase.ListIncomingRequestsUseCase,
	respondUC *usecase.RespondFriendRequestUseCase,
) *FriendHandler {
	return &FriendHandler{sendUC: sendUC, listUC: listUC, incomingUC: incomingUC, respondUC: respondUC}
}

// POST /v1/friends/requests
func (h *FriendHandler) SendRequest(w http.ResponseWriter, r *http.Request) {
	var body struct {
		DeviceID string `json:"device_id"`
		ToTag    string `json:"to_tag"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.DeviceID == "" || body.ToTag == "" {
		writeBadRequest(w, "device_id and to_tag are required")
		return
	}

	req, err := h.sendUC.Execute(r.Context(), body.DeviceID, body.ToTag)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"ok":      true,
		"request": friendRequestJSON(req),
	})
}

// GET /v1/friends?device_id=xxx
func (h *FriendHandler) ListFriends(w http.ResponseWriter, r *http.Request) {
	deviceID := r.URL.Query().Get("device_id")
	if deviceID == "" {
		writeBadRequest(w, "device_id query param is required")
		return
	}

	friends, err := h.listUC.Execute(r.Context(), deviceID)
	if err != nil {
		writeInternalError(w, err.Error())
		return
	}

	items := make([]map[string]any, 0, len(friends))
	for _, u := range friends {
		items = append(items, userJSON(u))
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "friends": items})
}

// GET /v1/friends/requests/incoming?device_id=xxx
func (h *FriendHandler) ListIncoming(w http.ResponseWriter, r *http.Request) {
	deviceID := r.URL.Query().Get("device_id")
	if deviceID == "" {
		writeBadRequest(w, "device_id query param is required")
		return
	}

	reqs, err := h.incomingUC.Execute(r.Context(), deviceID)
	if err != nil {
		writeInternalError(w, err.Error())
		return
	}

	items := make([]map[string]any, 0, len(reqs))
	for _, req := range reqs {
		items = append(items, friendRequestJSON(req))
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "requests": items})
}

// POST /v1/friends/requests/{requestID}/accept
func (h *FriendHandler) AcceptRequest(w http.ResponseWriter, r *http.Request) {
	h.respondRequest(w, r, true)
}

// DELETE /v1/friends/requests/{requestID}
func (h *FriendHandler) RejectRequest(w http.ResponseWriter, r *http.Request) {
	h.respondRequest(w, r, false)
}

func (h *FriendHandler) respondRequest(w http.ResponseWriter, r *http.Request, accept bool) {
	idStr := chi.URLParam(r, "requestID")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeBadRequest(w, "invalid requestID")
		return
	}

	var body struct {
		DeviceID string `json:"device_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.DeviceID == "" {
		writeBadRequest(w, "device_id is required")
		return
	}

	if err := h.respondUC.Execute(r.Context(), body.DeviceID, id, accept); err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func friendRequestJSON(req usecase.FriendRequest) map[string]any {
	return map[string]any{
		"id":        req.ID,
		"from_user": userJSON(req.FromUser),
		"to_user":   userJSON(req.ToUser),
		"status":    req.Status,
	}
}
