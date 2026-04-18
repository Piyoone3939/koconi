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
	"koconi/api/internal/infrastructure/storage"
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
	listByTagUC := usecase.NewListPlacementsByUserTagUseCase(placementRepo)

	// CreatePhotoUseCase: aiClient を DI（非同期ジョブ起動のみ）
	createPhotoUC := usecase.NewCreatePhotoUseCase(photoRepo, aiClient)

	photoHandler := handler.NewPhotoHandler(createPhotoUC)
	placementHandler := handler.NewPlacementHandler(createPlacementUC, listPlacementsUC, listByTagUC)

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
	getUserUC := usecase.NewGetUserUseCase(userRepo)
	updateUserUC := usecase.NewUpdateUserUseCase(userRepo)
	setPremiumUC := usecase.NewSetPremiumUseCase(userRepo)
	sendFriendReqUC := usecase.NewSendFriendRequestUseCase(userRepo, friendRepo)
	listFriendsUC := usecase.NewListFriendsUseCase(userRepo, friendRepo)
	listIncomingUC := usecase.NewListIncomingRequestsUseCase(userRepo, friendRepo)
	respondFriendReqUC := usecase.NewRespondFriendRequestUseCase(userRepo, friendRepo)
	userHandler := handler.NewUserHandler(registerUserUC, searchUserUC, getUserUC, updateUserUC, setPremiumUC)
	friendHandler := handler.NewFriendHandler(sendFriendReqUC, listFriendsUC, listIncomingUC, respondFriendReqUC)

	sharedMapRepo := repository.NewSharedMapRepository(pool)
	createSharedMapUC := usecase.NewCreateSharedMapUseCase(userRepo, sharedMapRepo)
	listSharedMapsUC := usecase.NewListSharedMapsUseCase(userRepo, sharedMapRepo)
	addMemberUC := usecase.NewAddSharedMapMemberUseCase(userRepo, sharedMapRepo)
	addPlacementUC := usecase.NewAddSharedMapPlacementUseCase(userRepo, sharedMapRepo)
	listSharedMapPlacementsUC := usecase.NewListSharedMapPlacementsUseCase(userRepo, sharedMapRepo)
	sharedMapHandler := handler.NewSharedMapHandler(createSharedMapUC, listSharedMapsUC, addMemberUC, addPlacementUC, listSharedMapPlacementsUC)

	tripRepo := repository.NewTripRepository(pool)
	createTripUC := usecase.NewCreateTripUseCase(userRepo, tripRepo)
	getTripUC := usecase.NewGetTripUseCase(userRepo, tripRepo)
	listTripsUC := usecase.NewListTripsUseCase(userRepo, tripRepo)
	updateTripUC := usecase.NewUpdateTripUseCase(userRepo, tripRepo)
	deleteTripUC := usecase.NewDeleteTripUseCase(userRepo, tripRepo)
	tripHandler := handler.NewTripHandler(createTripUC, getTripUC, listTripsUC, updateTripUC, deleteTripUC)

	commentRepo := repository.NewCommentRepository(pool)
	createCommentUC := usecase.NewCreateCommentUseCase(userRepo, commentRepo)
	listCommentsUC := usecase.NewListCommentsUseCase(commentRepo)
	deleteCommentUC := usecase.NewDeleteCommentUseCase(userRepo, commentRepo)
	commentHandler := handler.NewCommentHandler(createCommentUC, listCommentsUC, deleteCommentUC)

	searchRepo := repository.NewSearchRepository(pool)
	searchUC := usecase.NewSearchUseCase(userRepo, searchRepo)
	searchHandler := handler.NewSearchHandler(searchUC)

	sceneRepo := repository.NewSceneRepository(pool)
	createSceneUC := usecase.NewCreateSceneUseCase(userRepo, sceneRepo)
	listScenesUC := usecase.NewListScenesUseCase(userRepo, sceneRepo)
	sceneHandler := handler.NewSceneHandler(createSceneUC, listScenesUC)

	storagePath := os.Getenv("STORAGE_PATH")
	if storagePath == "" {
		storagePath = "/data/uploads"
	}
	localStorage := storage.NewLocalStorage(storagePath)
	uploadHandler := handler.NewUploadHandler(localStorage)

	pushTokenRepo := repository.NewPushTokenRepository(pool)
	registerPushUC := usecase.NewRegisterPushTokenUseCase(userRepo, pushTokenRepo)
	pushHandler := handler.NewPushHandler(registerPushUC)

	r := apphttp.NewRouter(memoryHandler, photoHandler, placementHandler, photoMatchHandler, photo3DStatusHandler, statsHandler, userHandler, friendHandler, sharedMapHandler, tripHandler, commentHandler, searchHandler, sceneHandler, uploadHandler, pushHandler)

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
