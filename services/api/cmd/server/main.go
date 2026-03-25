package main

import (
    "context"
    "log/slog"
    "net/http"
    "os"
    "time"

    "github.com/jackc/pgx/v5/pgxpool"
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

    ctx := context.Background()
    pool, err := pgxpool.New(ctx, dsn)
    if err != nil {
        slog.Error("db connect failed", "err", err)
        os.Exit(1)
    }
    defer pool.Close()

    memoryRepo := repository.NewMemoryRepository(pool)
    createUC := usecase.NewCreateMemoryUseCase(memoryRepo)
    listUC := usecase.NewListMemoryUseCase(memoryRepo)
    memoryHandler := handler.NewMemoryHandler(createUC, listUC)

    r := apphttp.NewRouter(memoryHandler)

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