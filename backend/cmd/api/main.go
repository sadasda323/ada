package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"github.com/hrco/backend/internal/config"
	"github.com/hrco/backend/internal/db"
	"github.com/hrco/backend/internal/handlers"
	"github.com/hrco/backend/internal/utils/security"
	seedpkg "github.com/hrco/backend/internal/seed"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintln(os.Stderr, "config:", err)
		os.Exit(1)
	}

	log, err := config.NewLogger(cfg.LogLevel, cfg.AppEnv)
	if err != nil {
		fmt.Fprintln(os.Stderr, "logger:", err)
		os.Exit(1)
	}
	defer func() { _ = log.Sync() }()

	gormDB, err := db.Open(cfg.DatabaseDSN, !cfg.IsProd())
	if err != nil {
		log.Fatal("db open", zap.Error(err))
	}
	if cfg.AutoMigrate {
		if err := db.Migrate(gormDB); err != nil {
			log.Fatal("migrate", zap.Error(err))
		}
		log.Info("database migrated")
	}

	if cfg.SeedOnBoot {
		if err := seedpkg.Run(gormDB, log); err != nil {
			log.Warn("seed failed", zap.Error(err))
		}
	}

	tm := security.NewTokenManager(cfg.JWTAccessSecret, cfg.JWTRefreshSecret, cfg.JWTAccessTTL, cfg.JWTRefreshTTL)
	router := handlers.NewRouter(cfg, gormDB, log, tm)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		log.Info("HRCO API listening", zap.String("addr", srv.Addr), zap.String("env", cfg.AppEnv))
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal("server", zap.Error(err))
		}
	}()

	// Graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	log.Info("shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Error("shutdown error", zap.Error(err))
	}
}
