package security

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/hrco/backend/internal/domain"
)

type AccessClaims struct {
	UsuarioID  string     `json:"uid"`
	Email      string     `json:"email"`
	Rol        domain.Rol `json:"rol"`
	EmpresaID  string     `json:"empresaId"`
	EmpleadoID string     `json:"empleadoId,omitempty"`
	jwt.RegisteredClaims
}

type RefreshClaims struct {
	UsuarioID string `json:"uid"`
	EmpresaID string `json:"empresaId"`
	JTI       string `json:"jti"`
	jwt.RegisteredClaims
}

type TokenManager struct {
	accessSecret  []byte
	refreshSecret []byte
	accessTTL     time.Duration
	refreshTTL    time.Duration
}

func NewTokenManager(accessSecret, refreshSecret string, accessTTL, refreshTTL time.Duration) *TokenManager {
	return &TokenManager{
		accessSecret:  []byte(accessSecret),
		refreshSecret: []byte(refreshSecret),
		accessTTL:     accessTTL,
		refreshTTL:    refreshTTL,
	}
}

func (m *TokenManager) AccessTTL() time.Duration  { return m.accessTTL }
func (m *TokenManager) RefreshTTL() time.Duration { return m.refreshTTL }

func (m *TokenManager) SignAccess(c AccessClaims) (string, error) {
	now := time.Now()
	c.RegisteredClaims = jwt.RegisteredClaims{
		Subject:   c.UsuarioID,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(m.accessTTL)),
		Issuer:    "hrco-api",
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	return tok.SignedString(m.accessSecret)
}

func (m *TokenManager) SignRefresh(c RefreshClaims) (string, error) {
	now := time.Now()
	if c.JTI == "" {
		c.JTI = uuid.NewString()
	}
	c.RegisteredClaims = jwt.RegisteredClaims{
		Subject:   c.UsuarioID,
		ID:        c.JTI,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(m.refreshTTL)),
		Issuer:    "hrco-api",
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	return tok.SignedString(m.refreshSecret)
}

func (m *TokenManager) ParseAccess(token string) (*AccessClaims, error) {
	claims := &AccessClaims{}
	t, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return m.accessSecret, nil
	})
	if err != nil || !t.Valid {
		return nil, err
	}
	return claims, nil
}

func (m *TokenManager) ParseRefresh(token string) (*RefreshClaims, error) {
	claims := &RefreshClaims{}
	t, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return m.refreshSecret, nil
	})
	if err != nil || !t.Valid {
		return nil, err
	}
	return claims, nil
}

// HashToken returns a deterministic hash for storing refresh tokens server-side.
func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
