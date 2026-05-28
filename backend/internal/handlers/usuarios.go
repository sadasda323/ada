package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/hrco/backend/internal/domain"
	"github.com/hrco/backend/internal/middleware"
	"github.com/hrco/backend/internal/utils/httpx"
	"github.com/hrco/backend/internal/utils/security"
	"github.com/hrco/backend/internal/utils/validate"
)

type UsuarioHandler struct {
	DB  *gorm.DB
	Log *zap.Logger
}

type usuarioCreateDTO struct {
	Email      string     `json:"email" validate:"required,email"`
	Password   string     `json:"password" validate:"required,min=8,max=128"`
	Nombre     string     `json:"nombre" validate:"required,min=1,max=100"`
	Apellido   string     `json:"apellido" validate:"required,min=1,max=100"`
	Rol        domain.Rol `json:"rol" validate:"required"`
	EmpleadoID *string    `json:"empleadoId,omitempty"`
}

type usuarioUpdateDTO struct {
	Nombre     string     `json:"nombre" validate:"required,min=1,max=100"`
	Apellido   string     `json:"apellido" validate:"required,min=1,max=100"`
	Rol        domain.Rol `json:"rol" validate:"required"`
	Activo     *bool      `json:"activo,omitempty"`
	EmpleadoID *string    `json:"empleadoId,omitempty"`
	Password   string     `json:"password,omitempty" validate:"omitempty,min=8,max=128"`
}

func (h *UsuarioHandler) List(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	p := ParsePagination(r)
	q := h.DB.Model(&domain.Usuario{}).Where("empresa_id = ?", a.EmpresaID)
	if p.Search != "" {
		s := "%" + p.Search + "%"
		q = q.Where("nombre ILIKE ? OR apellido ILIKE ? OR email ILIKE ?", s, s, s)
	}
	var total int64
	q.Count(&total)
	var items []domain.Usuario
	if err := q.Order("created_at desc").Limit(p.PageSize).Offset(p.Offset()).Find(&items).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	out := make([]publicUsuario, len(items))
	for i, u := range items {
		out[i] = toPublic(&u)
	}
	httpx.Paginated(w, out, httpx.PaginationMeta{
		Page: p.Page, PageSize: p.PageSize, Total: total,
		TotalPages: int((total + int64(p.PageSize) - 1) / int64(p.PageSize)),
	})
}

func (h *UsuarioHandler) Create(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	var in usuarioCreateDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if !in.Rol.Valid() {
		httpx.WriteError(w, h.Log, httpx.Validation("Rol inválido", nil))
		return
	}
	if err := strongPassword(in.Password); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	hash, err := security.HashPassword(in.Password)
	if err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	u := domain.Usuario{
		EmpresaID:    a.EmpresaID,
		Email:        in.Email,
		PasswordHash: hash,
		Nombre:       in.Nombre,
		Apellido:     in.Apellido,
		Rol:          in.Rol,
		Activo:       true,
		EmpleadoID:   in.EmpleadoID,
	}
	if err := h.DB.Create(&u).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.Created(w, toPublic(&u))
}

func (h *UsuarioHandler) Update(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	var in usuarioUpdateDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	var u domain.Usuario
	if err := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).First(&u).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	u.Nombre = in.Nombre
	u.Apellido = in.Apellido
	u.Rol = in.Rol
	if in.Activo != nil {
		u.Activo = *in.Activo
	}
	u.EmpleadoID = in.EmpleadoID
	if in.Password != "" {
		if err := strongPassword(in.Password); err != nil {
			httpx.WriteError(w, h.Log, err)
			return
		}
		hash, err := security.HashPassword(in.Password)
		if err != nil {
			httpx.WriteError(w, h.Log, err)
			return
		}
		u.PasswordHash = hash
	}
	if err := h.DB.Save(&u).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.OK(w, toPublic(&u))
}

func (h *UsuarioHandler) Delete(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	if id == a.UserID {
		httpx.WriteError(w, h.Log, httpx.Validation("No puedes eliminar tu propio usuario", nil))
		return
	}
	res := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).Delete(&domain.Usuario{})
	if res.Error != nil {
		httpx.WriteError(w, h.Log, res.Error)
		return
	}
	if res.RowsAffected == 0 {
		httpx.WriteError(w, h.Log, httpx.NotFound(""))
		return
	}
	httpx.NoContent(w)
}
