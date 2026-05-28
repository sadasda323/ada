//go:build windows && 386

package handlers_test

import (
	"net/http"
	"testing"

	"gorm.io/gorm"
)

// testApp en windows/386 hace skip — modernc.org/sqlite no compila para 386.
// Estos tests corren en linux/amd64, Docker y CI.
func testApp(t *testing.T) (http.Handler, *gorm.DB) {
	t.Helper()
	t.Skip("SQLite pure-Go no soporta windows/386; corre con linux/amd64 o Docker")
	return nil, nil
}
