package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/hrco/backend/internal/domain"
	"github.com/hrco/backend/internal/utils/httpx"
	"github.com/hrco/backend/internal/utils/security"
)

// Context keys
type ctxKey int

const (
	ctxKeyUserID ctxKey = iota
	ctxKeyUserEmail
	ctxKeyUserRol
	ctxKeyEmpresaID
	ctxKeyEmpleadoID
)

// AuthContext represents the authenticated principal.
type AuthContext struct {
	UserID     string
	Email      string
	Rol        domain.Rol
	EmpresaID  string
	EmpleadoID string
}

// FromContext extracts auth values from context. Returns zero AuthContext if missing.
func FromContext(ctx context.Context) AuthContext {
	return AuthContext{
		UserID:     stringFromCtx(ctx, ctxKeyUserID),
		Email:      stringFromCtx(ctx, ctxKeyUserEmail),
		Rol:        domain.Rol(stringFromCtx(ctx, ctxKeyUserRol)),
		EmpresaID:  stringFromCtx(ctx, ctxKeyEmpresaID),
		EmpleadoID: stringFromCtx(ctx, ctxKeyEmpleadoID),
	}
}

func stringFromCtx(ctx context.Context, k ctxKey) string {
	if v, ok := ctx.Value(k).(string); ok {
		return v
	}
	return ""
}

// RequireAuth validates the Bearer token and injects auth into context.
func RequireAuth(tm *security.TokenManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authH := r.Header.Get("Authorization")
			if authH == "" || !strings.HasPrefix(authH, "Bearer ") {
				httpx.WriteError(w, nil, httpx.Unauthorized("Token de acceso faltante"))
				return
			}
			tok := strings.TrimSpace(strings.TrimPrefix(authH, "Bearer "))
			claims, err := tm.ParseAccess(tok)
			if err != nil || claims == nil {
				httpx.WriteError(w, nil, httpx.Unauthorized("Token inválido o expirado"))
				return
			}
			ctx := r.Context()
			ctx = context.WithValue(ctx, ctxKeyUserID, claims.UsuarioID)
			ctx = context.WithValue(ctx, ctxKeyUserEmail, claims.Email)
			ctx = context.WithValue(ctx, ctxKeyUserRol, string(claims.Rol))
			ctx = context.WithValue(ctx, ctxKeyEmpresaID, claims.EmpresaID)
			ctx = context.WithValue(ctx, ctxKeyEmpleadoID, claims.EmpleadoID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole returns 403 if the auth role is not in the allowed list.
func RequireRole(allowed ...domain.Rol) func(http.Handler) http.Handler {
	allowSet := make(map[domain.Rol]struct{}, len(allowed))
	for _, r := range allowed {
		allowSet[r] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			a := FromContext(r.Context())
			if a.UserID == "" {
				httpx.WriteError(w, nil, httpx.Unauthorized(""))
				return
			}
			if _, ok := allowSet[a.Rol]; !ok {
				httpx.WriteError(w, nil, httpx.Forbidden("No tienes permisos para esta acción"))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
