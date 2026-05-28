package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func doJSON(t *testing.T, h http.Handler, method, path string, body any, token string) *httptest.ResponseRecorder {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		require.NoError(t, json.NewEncoder(&buf).Encode(body))
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	return rr
}

type registerResp struct {
	Success bool `json:"success"`
	Data    struct {
		AccessToken  string `json:"accessToken"`
		RefreshToken string `json:"refreshToken"`
		User         struct {
			ID        string `json:"id"`
			Email     string `json:"email"`
			Rol       string `json:"rol"`
			EmpresaID string `json:"empresaId"`
		} `json:"user"`
	} `json:"data"`
}

func registerAdmin(t *testing.T, h http.Handler, nit, email string) registerResp {
	t.Helper()
	body := map[string]any{
		"empresa": map[string]any{
			"nit":         nit,
			"razonSocial": "Empresa Test",
		},
		"admin": map[string]any{
			"nombre":   "Admin",
			"apellido": "Test",
			"email":    email,
			"password": "Password1",
		},
	}
	rr := doJSON(t, h, "POST", "/api/auth/register", body, "")
	require.Equal(t, http.StatusCreated, rr.Code, rr.Body.String())
	var r registerResp
	require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &r))
	require.True(t, r.Success)
	require.NotEmpty(t, r.Data.AccessToken)
	return r
}

func TestAuth_RegisterAndLogin(t *testing.T) {
	app, _ := testApp(t)
	r := registerAdmin(t, app, "900111111-1", "ceo@test.com")
	assert.Equal(t, "ADMIN_EMPRESA", r.Data.User.Rol)
	assert.Equal(t, "ceo@test.com", r.Data.User.Email)

	// duplicado debe fallar (mismo NIT)
	rr := doJSON(t, app, "POST", "/api/auth/register", map[string]any{
		"empresa": map[string]any{"nit": "900111111-1", "razonSocial": "Duplicada"},
		"admin":   map[string]any{"nombre": "X", "apellido": "Y", "email": "x@y.com", "password": "Password1"},
	}, "")
	assert.Equal(t, http.StatusConflict, rr.Code)

	// login válido
	rr = doJSON(t, app, "POST", "/api/auth/login", map[string]any{
		"email": "ceo@test.com", "password": "Password1",
	}, "")
	assert.Equal(t, http.StatusOK, rr.Code)

	// login inválido
	rr = doJSON(t, app, "POST", "/api/auth/login", map[string]any{
		"email": "ceo@test.com", "password": "wrong",
	}, "")
	assert.Equal(t, http.StatusUnauthorized, rr.Code)
}

func TestAuth_Me_RequiresToken(t *testing.T) {
	app, _ := testApp(t)
	rr := doJSON(t, app, "GET", "/api/auth/me", nil, "")
	assert.Equal(t, http.StatusUnauthorized, rr.Code)

	r := registerAdmin(t, app, "900222222-2", "me@test.com")
	rr = doJSON(t, app, "GET", "/api/auth/me", nil, r.Data.AccessToken)
	assert.Equal(t, http.StatusOK, rr.Code)
}

func TestAuth_PasswordValidation(t *testing.T) {
	app, _ := testApp(t)
	// password sin mayúscula/dígito
	rr := doJSON(t, app, "POST", "/api/auth/register", map[string]any{
		"empresa": map[string]any{"nit": "900333333-3", "razonSocial": "Test"},
		"admin":   map[string]any{"nombre": "X", "apellido": "Y", "email": "x@y.com", "password": "weakpass"},
	}, "")
	assert.Equal(t, http.StatusUnprocessableEntity, rr.Code)
}
