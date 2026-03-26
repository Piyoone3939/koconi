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
		v1.Post("/placements", placementHandler.CreatePlacement)
		v1.Get("/placements", placementHandler.ListPlacements)
		v1.Post("/photos/{photoID}/match", photoMatchHandler.MatchPhoto)
	})

	return r
}
