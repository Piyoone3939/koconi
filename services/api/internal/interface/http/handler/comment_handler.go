package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"koconi/api/internal/usecase"
)

type CommentHandler struct {
	createUC *usecase.CreateCommentUseCase
	listUC   *usecase.ListCommentsUseCase
	deleteUC *usecase.DeleteCommentUseCase
}

func NewCommentHandler(
	createUC *usecase.CreateCommentUseCase,
	listUC *usecase.ListCommentsUseCase,
	deleteUC *usecase.DeleteCommentUseCase,
) *CommentHandler {
	return &CommentHandler{createUC: createUC, listUC: listUC, deleteUC: deleteUC}
}

// POST /v1/comments
func (h *CommentHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	var body struct {
		DeviceID   string `json:"device_id"`
		TargetType string `json:"target_type"`
		TargetID   int64  `json:"target_id"`
		Body       string `json:"body"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeBadRequest(w, "invalid json")
		return
	}

	comment, err := h.createUC.Execute(r.Context(), body.DeviceID, body.TargetType, body.TargetID, body.Body)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"ok": true, "comment": comment})
}

// GET /v1/comments?target_type=photo&target_id=123
func (h *CommentHandler) ListComments(w http.ResponseWriter, r *http.Request) {
	targetType := r.URL.Query().Get("target_type")
	targetIDStr := r.URL.Query().Get("target_id")

	if targetType == "" || targetIDStr == "" {
		writeBadRequest(w, "target_type and target_id are required")
		return
	}

	targetID, err := strconv.ParseInt(targetIDStr, 10, 64)
	if err != nil {
		writeBadRequest(w, "invalid target_id")
		return
	}

	comments, err := h.listUC.Execute(r.Context(), targetType, targetID)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "comments": comments})
}

// DELETE /v1/comments/{commentID}
func (h *CommentHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	commentID, err := strconv.ParseInt(chi.URLParam(r, "commentID"), 10, 64)
	if err != nil {
		writeBadRequest(w, "invalid comment id")
		return
	}

	var body struct {
		DeviceID string `json:"device_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeBadRequest(w, "invalid json")
		return
	}

	if err := h.deleteUC.Execute(r.Context(), body.DeviceID, commentID); err != nil {
		if err.Error() == "comment not found or forbidden" {
			writeJSON(w, http.StatusForbidden, errorResponse{OK: false, Error: err.Error()})
			return
		}
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}
