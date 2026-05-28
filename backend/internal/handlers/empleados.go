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

type EmpleadoHandler struct {
	DB  *gorm.DB
	Log *zap.Logger
}

type empleadoDTO struct {
	Documento       string          `json:"documento" validate:"required,min=4,max=30"`
	TipoDocumento   string          `json:"tipoDocumento" validate:"omitempty,oneof=CC CE PA TI NIT"`
	Nombre          string          `json:"nombre" validate:"required,min=1,max=100"`
	Apellido        string          `json:"apellido" validate:"required,min=1,max=100"`
	Email           string          `json:"email" validate:"omitempty,email"`
	Telefono        string          `json:"telefono" validate:"omitempty,max=30"`
	Direccion       string          `json:"direccion" validate:"omitempty,max=300"`
	FechaNacimiento *time.Time      `json:"fechaNacimiento,omitempty"`
	FechaIngreso    time.Time       `json:"fechaIngreso" validate:"required"`
	FechaRetiro     *time.Time      `json:"fechaRetiro,omitempty"`
	TipoContrato    domain.TipoContrato `json:"tipoContrato" validate:"omitempty"`
	Salario         decimal.Decimal `json:"salario" validate:"required"`
	AreaID          *string         `json:"areaId,omitempty"`
	CargoID         *string         `json:"cargoId,omitempty"`
	Banco           string          `json:"banco" validate:"omitempty,max=60"`
	CuentaBancaria  string          `json:"cuentaBancaria" validate:"omitempty,max=30"`
	EPS             string          `json:"eps" validate:"omitempty,max=60"`
	ARL             string          `json:"arl" validate:"omitempty,max=60"`
	Pension         string          `json:"pension" validate:"omitempty,max=60"`
	Cesantias       string          `json:"cesantias" validate:"omitempty,max=60"`
	Estado          domain.EstadoEmpleado `json:"estado" validate:"omitempty"`
}

func (h *EmpleadoHandler) List(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	p := ParsePagination(r)
	q := h.DB.Model(&domain.Empleado{}).Preload("Area").Preload("Cargo").Where("empresa_id = ?", a.EmpresaID)
	if p.Search != "" {
		s := "%" + p.Search + "%"
		q = q.Where("nombre ILIKE ? OR apellido ILIKE ? OR documento ILIKE ? OR email ILIKE ?", s, s, s, s)
	}
	if estado := r.URL.Query().Get("estado"); estado != "" {
		q = q.Where("estado = ?", estado)
	}
	if areaID := r.URL.Query().Get("areaId"); areaID != "" {
		q = q.Where("area_id = ?", areaID)
	}
	if cargoID := r.URL.Query().Get("cargoId"); cargoID != "" {
		q = q.Where("cargo_id = ?", cargoID)
	}
	var total int64
	q.Count(&total)
	var items []domain.Empleado
	if err := q.Order("created_at desc").Limit(p.PageSize).Offset(p.Offset()).Find(&items).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.Paginated(w, items, httpx.PaginationMeta{
		Page: p.Page, PageSize: p.PageSize, Total: total,
		TotalPages: int((total + int64(p.PageSize) - 1) / int64(p.PageSize)),
	})
}

func (h *EmpleadoHandler) Create(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	var in empleadoDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	e := buildEmpleado(in, a.EmpresaID)
	if err := h.DB.Create(&e).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	h.DB.Preload("Area").Preload("Cargo").First(&e, "id = ?", e.ID)
	httpx.Created(w, e)
}

func (h *EmpleadoHandler) Get(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	var e domain.Empleado
	if err := h.DB.Preload("Area").Preload("Cargo").
		Where("id = ? AND empresa_id = ?", id, a.EmpresaID).First(&e).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.OK(w, e)
}

func (h *EmpleadoHandler) Update(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	var in empleadoDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	var e domain.Empleado
	if err := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).First(&e).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	applyEmpleado(&e, in)
	if err := h.DB.Save(&e).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	h.DB.Preload("Area").Preload("Cargo").First(&e, "id = ?", e.ID)
	httpx.OK(w, e)
}

func (h *EmpleadoHandler) Delete(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	res := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).Delete(&domain.Empleado{})
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

func buildEmpleado(in empleadoDTO, empresaID string) domain.Empleado {
	e := domain.Empleado{
		EmpresaID: empresaID,
	}
	applyEmpleado(&e, in)
	return e
}

func applyEmpleado(e *domain.Empleado, in empleadoDTO) {
	e.Documento = in.Documento
	if in.TipoDocumento != "" {
		e.TipoDocumento = in.TipoDocumento
	} else if e.TipoDocumento == "" {
		e.TipoDocumento = "CC"
	}
	e.Nombre = in.Nombre
	e.Apellido = in.Apellido
	e.Email = in.Email
	e.Telefono = in.Telefono
	e.Direccion = in.Direccion
	e.FechaNacimiento = in.FechaNacimiento
	e.FechaIngreso = in.FechaIngreso
	e.FechaRetiro = in.FechaRetiro
	if in.TipoContrato != "" {
		e.TipoContrato = in.TipoContrato
	} else if e.TipoContrato == "" {
		e.TipoContrato = domain.ContratoIndefinido
	}
	e.Salario = in.Salario
	e.AreaID = in.AreaID
	e.CargoID = in.CargoID
	e.Banco = in.Banco
	e.CuentaBancaria = in.CuentaBancaria
	e.EPS = in.EPS
	e.ARL = in.ARL
	e.Pension = in.Pension
	e.Cesantias = in.Cesantias
	if in.Estado != "" {
		e.Estado = in.Estado
	} else if e.Estado == "" {
		e.Estado = domain.EstadoActivo
	}
}
