package handlers

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/shopspring/decimal"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/hrco/backend/internal/domain"
	"github.com/hrco/backend/internal/middleware"
	"github.com/hrco/backend/internal/utils/httpx"
	"github.com/hrco/backend/internal/utils/validate"
)

type NovedadHandler struct {
	DB  *gorm.DB
	Log *zap.Logger
}

type novedadDTO struct {
	EmpleadoID  string             `json:"empleadoId" validate:"required"`
	Tipo        domain.TipoNovedad `json:"tipo" validate:"required"`
	FechaInicio time.Time          `json:"fechaInicio" validate:"required"`
	FechaFin    *time.Time         `json:"fechaFin,omitempty"`
	Cantidad    decimal.Decimal    `json:"cantidad"`
	Monto       decimal.Decimal    `json:"monto"`
	Descripcion string             `json:"descripcion" validate:"omitempty,max=500"`
}

func (h *NovedadHandler) List(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	p := ParsePagination(r)
	q := h.DB.Model(&domain.Novedad{}).Preload("Empleado").Where("empresa_id = ?", a.EmpresaID)
	if estado := r.URL.Query().Get("estado"); estado != "" {
		q = q.Where("estado = ?", estado)
	}
	if tipo := r.URL.Query().Get("tipo"); tipo != "" {
		q = q.Where("tipo = ?", tipo)
	}
	if empID := r.URL.Query().Get("empleadoId"); empID != "" {
		q = q.Where("empleado_id = ?", empID)
	}
	var total int64
	q.Count(&total)
	var items []domain.Novedad
	if err := q.Order("fecha_inicio desc").Limit(p.PageSize).Offset(p.Offset()).Find(&items).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.Paginated(w, items, httpx.PaginationMeta{
		Page: p.Page, PageSize: p.PageSize, Total: total,
		TotalPages: int((total + int64(p.PageSize) - 1) / int64(p.PageSize)),
	})
}

func (h *NovedadHandler) Create(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	var in novedadDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	// Verifica que el empleado pertenezca a la empresa
	var emp domain.Empleado
	if err := h.DB.Where("id = ? AND empresa_id = ?", in.EmpleadoID, a.EmpresaID).First(&emp).Error; err != nil {
		httpx.WriteError(w, h.Log, httpx.NotFound("Empleado no encontrado"))
		return
	}
	n := domain.Novedad{
		EmpresaID:   a.EmpresaID,
		EmpleadoID:  in.EmpleadoID,
		Tipo:        in.Tipo,
		FechaInicio: in.FechaInicio,
		FechaFin:    in.FechaFin,
		Cantidad:    in.Cantidad,
		Monto:       in.Monto,
		Descripcion: in.Descripcion,
		Estado:      domain.NovedadPendiente,
	}
	if err := h.DB.Create(&n).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.Created(w, n)
}

func (h *NovedadHandler) Update(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	var in novedadDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	var n domain.Novedad
	if err := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).First(&n).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	n.Tipo = in.Tipo
	n.FechaInicio = in.FechaInicio
	n.FechaFin = in.FechaFin
	n.Cantidad = in.Cantidad
	n.Monto = in.Monto
	n.Descripcion = in.Descripcion
	if err := h.DB.Save(&n).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.OK(w, n)
}

func (h *NovedadHandler) Delete(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	res := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).Delete(&domain.Novedad{})
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

func (h *NovedadHandler) ChangeEstado(estado domain.EstadoNovedad) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		a := middleware.FromContext(r.Context())
		id := chi.URLParam(r, "id")
		res := h.DB.Model(&domain.Novedad{}).
			Where("id = ? AND empresa_id = ?", id, a.EmpresaID).
			Update("estado", estado)
		if res.Error != nil {
			httpx.WriteError(w, h.Log, res.Error)
			return
		}
		if res.RowsAffected == 0 {
			httpx.WriteError(w, h.Log, httpx.NotFound(""))
			return
		}
		var n domain.Novedad
		h.DB.First(&n, "id = ?", id)
		httpx.OK(w, n)
	}
}
