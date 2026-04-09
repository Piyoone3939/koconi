package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"koconi/api/internal/domain"
	"koconi/api/internal/usecase"
)

type SharedMapHandler struct {
	createUC         *usecase.CreateSharedMapUseCase
	listUC           *usecase.ListSharedMapsUseCase
	addMemberUC      *usecase.AddSharedMapMemberUseCase
	addPlacementUC   *usecase.AddSharedMapPlacementUseCase
	listPlacementsUC *usecase.ListSharedMapPlacementsUseCase
}

func NewSharedMapHandler(
	createUC *usecase.CreateSharedMapUseCase,
	listUC *usecase.ListSharedMapsUseCase,
	addMemberUC *usecase.AddSharedMapMemberUseCase,
	addPlacementUC *usecase.AddSharedMapPlacementUseCase,
	listPlacementsUC *usecase.ListSharedMapPlacementsUseCase,
) *SharedMapHandler {
	return &SharedMapHandler{
		createUC:         createUC,
		listUC:           listUC,
		addMemberUC:      addMemberUC,
		addPlacementUC:   addPlacementUC,
		listPlacementsUC: listPlacementsUC,
	}
}

// POST /v1/shared-maps
func (h *SharedMapHandler) Create(w http.ResponseWriter, r *http.Request) {
	var body struct {
		DeviceID string `json:"device_id"`
		Name     string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.DeviceID == "" || body.Name == "" {
		writeBadRequest(w, "device_id and name are required")
		return
	}

	m, err := h.createUC.Execute(r.Context(), body.DeviceID, body.Name)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"ok":  true,
		"map": domainSharedMapJSON(m),
	})
}

// GET /v1/shared-maps?device_id=xxx
func (h *SharedMapHandler) List(w http.ResponseWriter, r *http.Request) {
	deviceID := r.URL.Query().Get("device_id")
	if deviceID == "" {
		writeBadRequest(w, "device_id query param is required")
		return
	}

	maps, err := h.listUC.Execute(r.Context(), deviceID)
	if err != nil {
		writeInternalError(w, err.Error())
		return
	}

	items := make([]map[string]any, 0, len(maps))
	for _, m := range maps {
		items = append(items, domainSharedMapJSON(m))
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "maps": items})
}

// POST /v1/shared-maps/{mapID}/members
func (h *SharedMapHandler) AddMember(w http.ResponseWriter, r *http.Request) {
	mapID, err := parseMapID(r)
	if err != nil {
		writeBadRequest(w, "invalid mapID")
		return
	}

	var body struct {
		DeviceID  string `json:"device_id"`
		MemberTag string `json:"member_tag"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.DeviceID == "" || body.MemberTag == "" {
		writeBadRequest(w, "device_id and member_tag are required")
		return
	}

	if err := h.addMemberUC.Execute(r.Context(), body.DeviceID, mapID, body.MemberTag); err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// POST /v1/shared-maps/{mapID}/placements
func (h *SharedMapHandler) AddPlacement(w http.ResponseWriter, r *http.Request) {
	mapID, err := parseMapID(r)
	if err != nil {
		writeBadRequest(w, "invalid mapID")
		return
	}

	var body struct {
		DeviceID    string `json:"device_id"`
		PlacementID int64  `json:"placement_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.DeviceID == "" || body.PlacementID == 0 {
		writeBadRequest(w, "device_id and placement_id are required")
		return
	}

	if err := h.addPlacementUC.Execute(r.Context(), body.DeviceID, mapID, body.PlacementID); err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

// GET /v1/shared-maps/{mapID}/placements?device_id=xxx
func (h *SharedMapHandler) ListPlacements(w http.ResponseWriter, r *http.Request) {
	mapID, err := parseMapID(r)
	if err != nil {
		writeBadRequest(w, "invalid mapID")
		return
	}

	deviceID := r.URL.Query().Get("device_id")
	if deviceID == "" {
		writeBadRequest(w, "device_id query param is required")
		return
	}

	placements, err := h.listPlacementsUC.Execute(r.Context(), deviceID, mapID)
	if err != nil {
		writeBadRequest(w, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "placements": placements})
}

func parseMapID(r *http.Request) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, "mapID"), 10, 64)
}

func domainSharedMapJSON(m domain.SharedMap) map[string]any {
	return map[string]any{
		"id":            m.ID,
		"name":          m.Name,
		"owner_user_id": m.OwnerUserID,
		"created_at":    m.CreatedAt,
	}
}
