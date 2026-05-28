package config

import (
	"fmt"
	"time"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	AppEnv           string        `envconfig:"APP_ENV" default:"development"`
	Port             string        `envconfig:"PORT" default:"4000"`
	DatabaseDSN      string        `envconfig:"DATABASE_DSN" required:"true"`
	JWTAccessSecret  string        `envconfig:"JWT_ACCESS_SECRET" required:"true"`
	JWTRefreshSecret string        `envconfig:"JWT_REFRESH_SECRET" required:"true"`
	JWTAccessTTL     time.Duration `envconfig:"JWT_ACCESS_TTL" default:"15m"`
	JWTRefreshTTL    time.Duration `envconfig:"JWT_REFRESH_TTL" default:"168h"`
	CORSOrigin       string        `envconfig:"CORS_ORIGIN" default:"http://localhost:5173"`
	LogLevel         string        `envconfig:"LOG_LEVEL" default:"info"`
	AutoMigrate      bool          `envconfig:"AUTO_MIGRATE" default:"true"`
	SeedOnBoot       bool          `envconfig:"SEED_ON_BOOT" default:"false"`
}

func (c Config) IsProd() bool { return c.AppEnv == "production" }
func (c Config) IsTest() bool { return c.AppEnv == "test" }

// Load reads .env (if present) then env vars into Config.
func Load() (*Config, error) {
	_ = godotenv.Load()
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		return nil, fmt.Errorf("config: %w", err)
	}
	if len(cfg.JWTAccessSecret) < 16 {
		return nil, fmt.Errorf("JWT_ACCESS_SECRET must be at least 16 chars")
	}
	if len(cfg.JWTRefreshSecret) < 16 {
		return nil, fmt.Errorf("JWT_REFRESH_SECRET must be at least 16 chars")
	}
	return &cfg, nil
}
