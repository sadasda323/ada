package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/hrco/backend/internal/domain"
	"github.com/hrco/backend/internal/middleware"
	"github.com/hrco/backend/internal/utils/httpx"
	"github.com/hrco/backend/internal/utils/validate"
)

type AreaHandler struct {
	DB  *gorm.DB
	Log *zap.Logger
}

type areaDTO struct {
	Nombre      string `json:"nombre" validate:"required,min=1,max=120"`
	Descripcion string `json:"descripcion" validate:"omitempty,max=500"`
	Activa      *bool  `json:"activa,omitempty"`
}

func (h *AreaHandler) List(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	p := ParsePagination(r)
	q := h.DB.Model(&domain.Area{}).Where("empresa_id = ?", a.EmpresaID)
	if p.Search != "" {
		q = q.Where("nombre ILIKE ?", "%"+p.Search+"%")
	}
	var total int64
	q.Count(&total)
	var items []domain.Area
	if err := q.Order("nombre asc").Limit(p.PageSize).Offset(p.Offset()).Find(&items).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.Paginated(w, items, httpx.PaginationMeta{
		Page: p.Page, PageSize: p.PageSize, Total: total,
		TotalPages: int((total + int64(p.PageSize) - 1) / int64(p.PageSize)),
	})
}

func (h *AreaHandler) Create(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	var in areaDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	area := domain.Area{
		EmpresaID:   a.EmpresaID,
		Nombre:      in.Nombre,
		Descripcion: in.Descripcion,
		Activa:      true,
	}
	if in.Activa != nil {
		area.Activa = *in.Activa
	}
	if err := h.DB.Create(&area).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.Created(w, area)
}

func (h *AreaHandler) Get(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	var area domain.Area
	if err := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).First(&area).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.OK(w, area)
}

func (h *AreaHandler) Update(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	var in areaDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	var area domain.Area
	if err := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).First(&area).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	area.Nombre = in.Nombre
	area.Descripcion = in.Descripcion
	if in.Activa != nil {
		area.Activa = *in.Activa
	}
	if err := h.DB.Save(&area).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.OK(w, area)
}

func (h *AreaHandler) Delete(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	res := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).Delete(&domain.Area{})
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
