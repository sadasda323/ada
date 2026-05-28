package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/shopspring/decimal"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/hrco/backend/internal/domain"
	"github.com/hrco/backend/internal/middleware"
	"github.com/hrco/backend/internal/utils/httpx"
	"github.com/hrco/backend/internal/utils/validate"
)

type CargoHandler struct {
	DB  *gorm.DB
	Log *zap.Logger
}

type cargoDTO struct {
	Nombre      string          `json:"nombre" validate:"required,min=1,max=150"`
	Descripcion string          `json:"descripcion" validate:"omitempty,max=500"`
	SalarioBase decimal.Decimal `json:"salarioBase" validate:"required"`
	Activo      *bool           `json:"activo,omitempty"`
}

func (h *CargoHandler) List(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	p := ParsePagination(r)
	q := h.DB.Model(&domain.Cargo{}).Where("empresa_id = ?", a.EmpresaID)
	if p.Search != "" {
		q = q.Where("nombre ILIKE ?", "%"+p.Search+"%")
	}
	var total int64
	q.Count(&total)
	var items []domain.Cargo
	if err := q.Order("nombre asc").Limit(p.PageSize).Offset(p.Offset()).Find(&items).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.Paginated(w, items, httpx.PaginationMeta{
		Page: p.Page, PageSize: p.PageSize, Total: total,
		TotalPages: int((total + int64(p.PageSize) - 1) / int64(p.PageSize)),
	})
}

func (h *CargoHandler) Create(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	var in cargoDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	c := domain.Cargo{
		EmpresaID:   a.EmpresaID,
		Nombre:      in.Nombre,
		Descripcion: in.Descripcion,
		SalarioBase: in.SalarioBase,
		Activo:      true,
	}
	if in.Activo != nil {
		c.Activo = *in.Activo
	}
	if err := h.DB.Create(&c).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.Created(w, c)
}

func (h *CargoHandler) Get(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	var c domain.Cargo
	if err := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).First(&c).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.OK(w, c)
}

func (h *CargoHandler) Update(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	var in cargoDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	var c domain.Cargo
	if err := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).First(&c).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	c.Nombre = in.Nombre
	c.Descripcion = in.Descripcion
	c.SalarioBase = in.SalarioBase
	if in.Activo != nil {
		c.Activo = *in.Activo
	}
	if err := h.DB.Save(&c).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.OK(w, c)
}

func (h *CargoHandler) Delete(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	res := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).Delete(&domain.Cargo{})
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
