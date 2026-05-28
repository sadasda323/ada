package db

import (
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/hrco/backend/internal/domain"
)

// Open establishes a connection to PostgreSQL via GORM.
func Open(dsn string, debug bool) (*gorm.DB, error) {
	logLevel := logger.Warn
	if debug {
		logLevel = logger.Info
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:                 logger.Default.LogMode(logLevel),
		SkipDefaultTransaction: false,
		PrepareStmt:            true,
	})
	if err != nil {
		return nil, fmt.Errorf("db open: %w", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	return db, nil
}

// Migrate auto-creates/updates tables for all domain models.
func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&domain.Empresa{},
		&domain.Empleado{},
		&domain.Usuario{},
		&domain.RefreshToken{},
		&domain.Area{},
		&domain.Cargo{},
		&domain.PeriodoNomina{},
		&domain.DetalleNomina{},
		&domain.Novedad{},
	)
}
