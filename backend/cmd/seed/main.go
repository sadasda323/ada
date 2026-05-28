package main

import (
	"fmt"
	"os"

	"go.uber.org/zap"

	"github.com/hrco/backend/internal/config"
	"github.com/hrco/backend/internal/db"
	"github.com/hrco/backend/internal/seed"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintln(os.Stderr, "config:", err)
		os.Exit(1)
	}
	log, _ := config.NewLogger(cfg.LogLevel, cfg.AppEnv)
	defer func() { _ = log.Sync() }()

	gormDB, err := db.Open(cfg.DatabaseDSN, true)
	if err != nil {
		log.Fatal("db open", zap.Error(err))
	}
	if err := db.Migrate(gormDB); err != nil {
		log.Fatal("migrate", zap.Error(err))
	}
	if err := seed.Run(gormDB, log); err != nil {
		log.Fatal("seed", zap.Error(err))
	}
	log.Info("seed listo. Login admin@hrco.test / Admin123!")
}
