package http

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/cors"
    "koconi/api/internal/interface/http/handler"
)

func NewRouter(memoryHandler *handler.MemoryHandler) http.Handler {
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

    return r
}