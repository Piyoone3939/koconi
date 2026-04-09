package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"koconi/api/internal/usecase"
)

type PlacementHandler struct {
	createUC      *usecase.CreateLandmarkPlacementUseCase
	listUC        *usecase.ListLandmarkPlacementsByBoundsUseCase
	listByTagUC   *usecase.ListPlacementsByUserTagUseCase
}

func NewPlacementHandler(
	c *usecase.CreateLandmarkPlacementUseCase,
	l *usecase.ListLandmarkPlacementsByBoundsUseCase,
	lt *usecase.ListPlacementsByUserTagUseCase,
) *PlacementHandler {
	return &PlacementHandler{createUC: c, listUC: l, listByTagUC: lt}
}

type createPlacementRequest struct {
	PhotoID    int64     `json:"photo_id"`
	AssetID    string    `json:"asset_id"`
	Lat        float64   `json:"lat"`
	Lng        float64   `json:"lng"`
	Scale      float64   `json:"scale"`
	Rotation   []float64 `json:"rotation"`
	MatchScore *float64  `json:"match_score"`
	ModelURL   string    `json:"model_url"`
}

func (h *PlacementHandler) CreatePlacement(w http.ResponseWriter, r *http.Request) {
	var req createPlacementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeBadRequest(w, "invalid json")
		return
	}

	p, err := h.createUC.Execute(
		r.Context(),
		req.PhotoID,
		req.AssetID,
		req.Lat,
		req.Lng,
		req.Scale,
		req.Rotation,
		req.MatchScore,
		req.ModelURL,
	)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "placement": p})
}

func (h *PlacementHandler) ListPlacements(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	// user_tag が指定された場合はユーザー別フィルタ
	if userTag := q.Get("user_tag"); userTag != "" {
		limit := 200
		if s := q.Get("limit"); s != "" {
			v, e := strconv.Atoi(s)
			if e == nil {
				limit = v
			}
		}
		ps, err := h.listByTagUC.Execute(r.Context(), userTag, limit)
		if err != nil {
			writeInternalError(w, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"ok": true, "placements": ps})
		return
	}

	// バウンドベース（従来）
	minLat, err := strconv.ParseFloat(q.Get("min_lat"), 64)
	if err != nil {
		writeBadRequest(w, "invalid min_lat")
		return
	}
	maxLat, err := strconv.ParseFloat(q.Get("max_lat"), 64)
	if err != nil {
		writeBadRequest(w, "invalid max_lat")
		return
	}
	minLng, err := strconv.ParseFloat(q.Get("min_lng"), 64)
	if err != nil {
		writeBadRequest(w, "invalid min_lng")
		return
	}
	maxLng, err := strconv.ParseFloat(q.Get("max_lng"), 64)
	if err != nil {
		writeBadRequest(w, "invalid max_lng")
		return
	}

	limit := 100
	if s := q.Get("limit"); s != "" {
		v, e := strconv.Atoi(s)
		if e != nil {
			writeBadRequest(w, "invalid limit")
			return
		}
		limit = v
	}

	ps, err := h.listUC.Execute(r.Context(), minLat, maxLat, minLng, maxLng, limit)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "placements": ps})
}
