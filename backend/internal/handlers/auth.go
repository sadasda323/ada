package handlers

import (
	"errors"
	"net/http"
	"regexp"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/hrco/backend/internal/domain"
	"github.com/hrco/backend/internal/middleware"
	"github.com/hrco/backend/internal/utils/httpx"
	"github.com/hrco/backend/internal/utils/security"
	"github.com/hrco/backend/internal/utils/validate"
)

type AuthHandler struct {
	DB    *gorm.DB
	Tokens *security.TokenManager
	Log   *zap.Logger
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

type registerEmpresaDTO struct {
	NIT             string `json:"nit" validate:"required,min=5,max=20"`
	RazonSocial     string `json:"razonSocial" validate:"required,min=2,max=200"`
	NombreComercial string `json:"nombreComercial" validate:"omitempty,max=200"`
	Email           string `json:"email" validate:"omitempty,email"`
	Telefono        string `json:"telefono" validate:"omitempty,max=30"`
	Ciudad          string `json:"ciudad" validate:"omitempty,max=100"`
}

type registerAdminDTO struct {
	Nombre   string `json:"nombre" validate:"required,min=1,max=100"`
	Apellido string `json:"apellido" validate:"required,min=1,max=100"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=128"`
}

type registerDTO struct {
	Empresa registerEmpresaDTO `json:"empresa" validate:"required"`
	Admin   registerAdminDTO   `json:"admin" validate:"required"`
}

type loginDTO struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=1"`
}

type refreshDTO struct {
	RefreshToken string `json:"refreshToken" validate:"required,min=10"`
}

type tokenPair struct {
	AccessToken  string         `json:"accessToken"`
	RefreshToken string         `json:"refreshToken"`
	ExpiresIn    int            `json:"expiresIn"`
	User         publicUsuario  `json:"user"`
}

type publicUsuario struct {
	ID         string     `json:"id"`
	Email      string     `json:"email"`
	Nombre     string     `json:"nombre"`
	Apellido   string     `json:"apellido"`
	Rol        domain.Rol `json:"rol"`
	EmpresaID  string     `json:"empresaId"`
	EmpleadoID string     `json:"empleadoId,omitempty"`
}

func toPublic(u *domain.Usuario) publicUsuario {
	emp := ""
	if u.EmpleadoID != nil {
		emp = *u.EmpleadoID
	}
	return publicUsuario{
		ID: u.ID, Email: u.Email, Nombre: u.Nombre, Apellido: u.Apellido,
		Rol: u.Rol, EmpresaID: u.EmpresaID, EmpleadoID: emp,
	}
}

// ─── Validación de password ──────────────────────────────────────────────────

var (
	hasUpper = regexp.MustCompile(`[A-Z]`)
	hasLower = regexp.MustCompile(`[a-z]`)
	hasDigit = regexp.MustCompile(`\d`)
)

func strongPassword(pw string) error {
	if len(pw) < 8 {
		return httpx.Validation("La contraseña debe tener al menos 8 caracteres", nil)
	}
	if !hasUpper.MatchString(pw) || !hasLower.MatchString(pw) || !hasDigit.MatchString(pw) {
		return httpx.Validation("La contraseña debe contener mayúscula, minúscula y dígito", nil)
	}
	return nil
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

// POST /api/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var in registerDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := strongPassword(in.Admin.Password); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}

	var existing domain.Empresa
	if err := h.DB.Where("nit = ?", in.Empresa.NIT).First(&existing).Error; err == nil {
		httpx.WriteError(w, h.Log, httpx.Conflict("Ya existe una empresa con ese NIT", nil))
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		httpx.WriteError(w, h.Log, err)
		return
	}

	hash, err := security.HashPassword(in.Admin.Password)
	if err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}

	emp := domain.Empresa{
		NIT:             in.Empresa.NIT,
		RazonSocial:     in.Empresa.RazonSocial,
		NombreComercial: in.Empresa.NombreComercial,
		Email:           in.Empresa.Email,
		Telefono:        in.Empresa.Telefono,
		Ciudad:          in.Empresa.Ciudad,
		Activa:          true,
	}
	var user domain.Usuario

	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&emp).Error; err != nil {
			return err
		}
		user = domain.Usuario{
			EmpresaID:    emp.ID,
			Email:        in.Admin.Email,
			PasswordHash: hash,
			Nombre:       in.Admin.Nombre,
			Apellido:     in.Admin.Apellido,
			Rol:          domain.RolAdminEmpresa,
			Activo:       true,
		}
		return tx.Create(&user).Error
	})
	if err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}

	pair, err := h.issueTokens(r, &user)
	if err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.Created(w, pair)
}

// POST /api/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var in loginDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	var user domain.Usuario
	if err := h.DB.Where("email = ?", in.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			httpx.WriteError(w, h.Log, httpx.Unauthorized("Credenciales inválidas"))
			return
		}
		httpx.WriteError(w, h.Log, err)
		return
	}
	if !user.Activo {
		httpx.WriteError(w, h.Log, httpx.Forbidden("Usuario inactivo"))
		return
	}
	if !security.ComparePassword(user.PasswordHash, in.Password) {
		httpx.WriteError(w, h.Log, httpx.Unauthorized("Credenciales inválidas"))
		return
	}
	now := time.Now()
	user.UltimoLogin = &now
	_ = h.DB.Model(&user).Update("ultimo_login", now).Error

	pair, err := h.issueTokens(r, &user)
	if err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.OK(w, pair)
}

// POST /api/auth/refresh
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var in refreshDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	claims, err := h.Tokens.ParseRefresh(in.RefreshToken)
	if err != nil || claims == nil {
		httpx.WriteError(w, h.Log, httpx.Unauthorized("Refresh token inválido"))
		return
	}
	hash := security.HashToken(in.RefreshToken)
	var rt domain.RefreshToken
	if err := h.DB.Where("token_hash = ?", hash).First(&rt).Error; err != nil {
		httpx.WriteError(w, h.Log, httpx.Unauthorized("Refresh token revocado"))
		return
	}
	if rt.RevokedAt != nil || rt.ExpiresAt.Before(time.Now()) {
		httpx.WriteError(w, h.Log, httpx.Unauthorized("Refresh token expirado"))
		return
	}
	var user domain.Usuario
	if err := h.DB.First(&user, "id = ?", claims.UsuarioID).Error; err != nil {
		httpx.WriteError(w, h.Log, httpx.Unauthorized("Usuario no encontrado"))
		return
	}
	// Rotación: revoca el actual e inserta uno nuevo
	revokedAt := time.Now()
	_ = h.DB.Model(&rt).Update("revoked_at", revokedAt).Error

	pair, err := h.issueTokens(r, &user)
	if err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.OK(w, pair)
}

// POST /api/auth/logout (requiere auth)
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	if a.UserID == "" {
		httpx.WriteError(w, h.Log, httpx.Unauthorized(""))
		return
	}
	now := time.Now()
	h.DB.Model(&domain.RefreshToken{}).
		Where("usuario_id = ? AND revoked_at IS NULL", a.UserID).
		Update("revoked_at", now)
	httpx.NoContent(w)
}

// GET /api/auth/me
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	if a.UserID == "" {
		httpx.WriteError(w, h.Log, httpx.Unauthorized(""))
		return
	}
	var u domain.Usuario
	if err := h.DB.First(&u, "id = ?", a.UserID).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	var emp domain.Empresa
	_ = h.DB.First(&emp, "id = ?", u.EmpresaID).Error
	httpx.OK(w, map[string]any{
		"user":    toPublic(&u),
		"empresa": emp,
	})
}

// ─── helpers ─────────────────────────────────────────────────────────────────

func (h *AuthHandler) issueTokens(r *http.Request, u *domain.Usuario) (tokenPair, error) {
	empleadoID := ""
	if u.EmpleadoID != nil {
		empleadoID = *u.EmpleadoID
	}
	access, err := h.Tokens.SignAccess(security.AccessClaims{
		UsuarioID:  u.ID,
		Email:      u.Email,
		Rol:        u.Rol,
		EmpresaID:  u.EmpresaID,
		EmpleadoID: empleadoID,
	})
	if err != nil {
		return tokenPair{}, err
	}
	refresh, err := h.Tokens.SignRefresh(security.RefreshClaims{
		UsuarioID: u.ID,
		EmpresaID: u.EmpresaID,
	})
	if err != nil {
		return tokenPair{}, err
	}

	rt := domain.RefreshToken{
		TokenHash: security.HashToken(refresh),
		UsuarioID: u.ID,
		EmpresaID: u.EmpresaID,
		UserAgent: r.UserAgent(),
		IP:        r.RemoteAddr,
		ExpiresAt: time.Now().Add(h.Tokens.RefreshTTL()),
	}
	if err := h.DB.Create(&rt).Error; err != nil {
		return tokenPair{}, err
	}

	return tokenPair{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    int(h.Tokens.AccessTTL().Seconds()),
		User:         toPublic(u),
	}, nil
}
