package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	aiinfra "koconi/api/internal/infrastructure/ai"
	"koconi/api/internal/infrastructure/repository"
	apphttp "koconi/api/internal/interface/http"
	"koconi/api/internal/interface/http/handler"
	"koconi/api/internal/usecase"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		slog.Error("DATABASE_URL is required")
		os.Exit(1)
	}

	aiBaseURL := os.Getenv("AI_BASE_URL")
	if aiBaseURL == "" {
		aiBaseURL = "http://ai:8000"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		slog.Error("db connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	// main() のDI部分だけ差し替え
	memoryRepo := repository.NewMemoryRepository(pool)
	createMemoryUC := usecase.NewCreateMemoryUseCase(memoryRepo)
	listMemoryUC := usecase.NewListMemoryUseCase(memoryRepo)
	memoryHandler := handler.NewMemoryHandler(createMemoryUC, listMemoryUC)

	photoRepo := repository.NewPhotoRepository(pool)
	placementRepo := repository.NewLandmarkPlacementRepository(pool)

	createPhotoUC := usecase.NewCreatePhotoUseCase(photoRepo)
	createPlacementUC := usecase.NewCreateLandmarkPlacementUseCase(photoRepo, placementRepo)
	listPlacementsUC := usecase.NewListLandmarkPlacementsByBoundsUseCase(placementRepo)

	photoHandler := handler.NewPhotoHandler(createPhotoUC)
	placementHandler := handler.NewPlacementHandler(createPlacementUC, listPlacementsUC)

	aiClient := aiinfra.NewHTTPClient(aiBaseURL)
	matchPhotoUC := usecase.NewMatchPhotoUseCase(photoRepo, aiClient)
	photoMatchHandler := handler.NewPhotoMatchHandler(matchPhotoUC)

	r := apphttp.NewRouter(memoryHandler, photoHandler, placementHandler, photoMatchHandler)

	srv := &http.Server{
		Addr:              ":3000",
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}

	slog.Info("server started", "addr", srv.Addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("server stopped with error", "err", err)
		os.Exit(1)
	}
}
