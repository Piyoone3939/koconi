package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"koconi/api/internal/interface/http/handler"
)

func NewRouter(
	memoryHandler *handler.MemoryHandler,
	photoHandler *handler.PhotoHandler,
	placementHandler *handler.PlacementHandler,
	photoMatchHandler *handler.PhotoMatchHandler,
	photo3DStatusHandler *handler.Photo3DStatusHandler,
	statsHandler *handler.StatsHandler,
	userHandler *handler.UserHandler,
	friendHandler *handler.FriendHandler,
	sharedMapHandler *handler.SharedMapHandler,
) http.Handler {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: false,
	}))

	r.Get("/health", memoryHandler.Health)
	r.Post("/memory", memoryHandler.CreateMemory)
	r.Get("/memory", memoryHandler.ListMemory)

	r.Route("/v1", func(v1 chi.Router) {
		v1.Post("/photos", photoHandler.CreatePhoto)
		v1.Get("/photos/{photoID}/3d_status", photo3DStatusHandler.GetStatus)
		v1.Post("/placements", placementHandler.CreatePlacement)
		v1.Get("/placements", placementHandler.ListPlacements)
		v1.Post("/photos/{photoID}/match", photoMatchHandler.MatchPhoto)
		v1.Get("/stats", statsHandler.GetStats)

		v1.Post("/users/register", userHandler.Register)
		v1.Get("/users/search", userHandler.Search)

		v1.Post("/friends/requests", friendHandler.SendRequest)
		v1.Get("/friends", friendHandler.ListFriends)
		v1.Get("/friends/requests/incoming", friendHandler.ListIncoming)
		v1.Post("/friends/requests/{requestID}/accept", friendHandler.AcceptRequest)
		v1.Post("/friends/requests/{requestID}/reject", friendHandler.RejectRequest)

		v1.Post("/shared-maps", sharedMapHandler.Create)
		v1.Get("/shared-maps", sharedMapHandler.List)
		v1.Post("/shared-maps/{mapID}/members", sharedMapHandler.AddMember)
		v1.Post("/shared-maps/{mapID}/placements", sharedMapHandler.AddPlacement)
		v1.Get("/shared-maps/{mapID}/placements", sharedMapHandler.ListPlacements)
	})

	return r
}
