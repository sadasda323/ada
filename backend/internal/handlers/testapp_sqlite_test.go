//go:build !(windows && 386)

package handlers_test

import (
	"net/http"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/hrco/backend/internal/config"
	"github.com/hrco/backend/internal/db"
	"github.com/hrco/backend/internal/handlers"
	"github.com/hrco/backend/internal/utils/security"
)

// testApp returns a chi router wired against an in-memory SQLite DB.
func testApp(t *testing.T) (http.Handler, *gorm.DB) {
	t.Helper()
	g, err := gorm.Open(sqlite.Open("file::memory:?cache=shared&_pragma=foreign_keys(1)"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Migrate(g))
	cfg := &config.Config{
		AppEnv:           "test",
		Port:             "0",
		JWTAccessSecret:  "test-access-secret-must-be-long-enough",
		JWTRefreshSecret: "test-refresh-secret-must-be-long-enough",
		JWTAccessTTL:     15 * time.Minute,
		JWTRefreshTTL:    24 * time.Hour,
		CORSOrigin:       "http://localhost:5173",
	}
	tm := security.NewTokenManager(cfg.JWTAccessSecret, cfg.JWTRefreshSecret, cfg.JWTAccessTTL, cfg.JWTRefreshTTL)
	log := zap.NewNop()
	return handlers.NewRouter(cfg, g, log, tm), g
}
