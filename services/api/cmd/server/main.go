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
	ai3dURL := os.Getenv("AI_3D_BASE_URL") // 未設定時は aiBaseURL にフォールバック

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		slog.Error("db connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	memoryRepo := repository.NewMemoryRepository(pool)
	createMemoryUC := usecase.NewCreateMemoryUseCase(memoryRepo)
	listMemoryUC := usecase.NewListMemoryUseCase(memoryRepo)
	memoryHandler := handler.NewMemoryHandler(createMemoryUC, listMemoryUC)

	photoRepo := repository.NewPhotoRepository(pool)
	placementRepo := repository.NewLandmarkPlacementRepository(pool)
	aiClient := aiinfra.NewHTTPClient(aiBaseURL, ai3dURL)

	createPlacementUC := usecase.NewCreateLandmarkPlacementUseCase(photoRepo, placementRepo)
	listPlacementsUC := usecase.NewListLandmarkPlacementsByBoundsUseCase(placementRepo)

	// CreatePhotoUseCase: aiClient を DI（非同期ジョブ起動のみ）
	createPhotoUC := usecase.NewCreatePhotoUseCase(photoRepo, aiClient)

	photoHandler := handler.NewPhotoHandler(createPhotoUC)
	placementHandler := handler.NewPlacementHandler(createPlacementUC, listPlacementsUC)

	matchPhotoUC := usecase.NewMatchPhotoUseCase(photoRepo, aiClient)
	photoMatchHandler := handler.NewPhotoMatchHandler(matchPhotoUC)

	get3DStatusUC := usecase.NewGetPhoto3DStatusUseCase(photoRepo, placementRepo, aiClient)
	photo3DStatusHandler := handler.NewPhoto3DStatusHandler(get3DStatusUC)

	statsRepo := repository.NewStatsRepository(pool)
	statsUC := usecase.NewGetStatsUseCase(statsRepo)
	statsHandler := handler.NewStatsHandler(statsUC)

	userRepo := repository.NewUserRepository(pool)
	friendRepo := repository.NewFriendRequestRepository(pool)
	registerUserUC := usecase.NewRegisterUserUseCase(userRepo)
	searchUserUC := usecase.NewSearchUserUseCase(userRepo)
	sendFriendReqUC := usecase.NewSendFriendRequestUseCase(userRepo, friendRepo)
	listFriendsUC := usecase.NewListFriendsUseCase(userRepo, friendRepo)
	listIncomingUC := usecase.NewListIncomingRequestsUseCase(userRepo, friendRepo)
	respondFriendReqUC := usecase.NewRespondFriendRequestUseCase(userRepo, friendRepo)
	userHandler := handler.NewUserHandler(registerUserUC, searchUserUC)
	friendHandler := handler.NewFriendHandler(sendFriendReqUC, listFriendsUC, listIncomingUC, respondFriendReqUC)

	r := apphttp.NewRouter(memoryHandler, photoHandler, placementHandler, photoMatchHandler, photo3DStatusHandler, statsHandler, userHandler, friendHandler)

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
