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
	"github.com/hrco/backend/internal/services"
	"github.com/hrco/backend/internal/utils/httpx"
	"github.com/hrco/backend/internal/utils/validate"
)

type NominaHandler struct {
	DB  *gorm.DB
	Log *zap.Logger
}

type generarPeriodoDTO struct {
	Nombre       string              `json:"nombre" validate:"required,min=1,max=100"`
	FechaInicio  time.Time           `json:"fechaInicio" validate:"required"`
	FechaFin     time.Time           `json:"fechaFin" validate:"required"`
	Periodicidad domain.Periodicidad `json:"periodicidad" validate:"omitempty"`
}

// POST /api/nomina/periodos — genera un período abierto y los detalles base por empleado activo
func (h *NominaHandler) Generar(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	var in generarPeriodoDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if !in.FechaFin.After(in.FechaInicio) {
		httpx.WriteError(w, h.Log, httpx.Validation("La fecha fin debe ser posterior a la fecha inicio", nil))
		return
	}

	var emp domain.Empresa
	if err := h.DB.First(&emp, "id = ?", a.EmpresaID).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}

	periodicidad := in.Periodicidad
	if periodicidad == "" {
		periodicidad = emp.PeriodicidadNomina
	}

	periodo := domain.PeriodoNomina{
		EmpresaID:    a.EmpresaID,
		Nombre:       in.Nombre,
		FechaInicio:  in.FechaInicio,
		FechaFin:     in.FechaFin,
		Periodicidad: periodicidad,
		Estado:       domain.PeriodoAbierto,
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&periodo).Error; err != nil {
			return err
		}
		var empleados []domain.Empleado
		if err := tx.Preload("Cargo").
			Where("empresa_id = ? AND estado = ?", a.EmpresaID, domain.EstadoActivo).
			Find(&empleados).Error; err != nil {
			return err
		}
		for _, e := range empleados {
			detalle := services.Calculate(&emp, services.PayrollInput{Empleado: e})
			detalle.PeriodoID = periodo.ID
			if err := tx.Create(&detalle).Error; err != nil {
				return err
			}
		}
		return recomputeTotales(tx, periodo.ID)
	})
	if err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}

	h.DB.Preload("Detalles.Empleado").First(&periodo, "id = ?", periodo.ID)
	httpx.Created(w, periodo)
}

// GET /api/nomina/periodos
func (h *NominaHandler) Listar(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	p := ParsePagination(r)
	q := h.DB.Model(&domain.PeriodoNomina{}).Where("empresa_id = ?", a.EmpresaID)
	if estado := r.URL.Query().Get("estado"); estado != "" {
		q = q.Where("estado = ?", estado)
	}
	var total int64
	q.Count(&total)
	var items []domain.PeriodoNomina
	if err := q.Order("fecha_inicio desc").Limit(p.PageSize).Offset(p.Offset()).Find(&items).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.Paginated(w, items, httpx.PaginationMeta{
		Page: p.Page, PageSize: p.PageSize, Total: total,
		TotalPages: int((total + int64(p.PageSize) - 1) / int64(p.PageSize)),
	})
}

// GET /api/nomina/periodos/{id}
func (h *NominaHandler) Detalle(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	var p domain.PeriodoNomina
	if err := h.DB.Preload("Detalles.Empleado").
		Where("id = ? AND empresa_id = ?", id, a.EmpresaID).First(&p).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.OK(w, p)
}

// POST /api/nomina/periodos/{id}/recalcular — re-aplica novedades aprobadas y recalcula
func (h *NominaHandler) Recalcular(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")

	var emp domain.Empresa
	if err := h.DB.First(&emp, "id = ?", a.EmpresaID).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}

	var periodo domain.PeriodoNomina
	if err := h.DB.Where("id = ? AND empresa_id = ?", id, a.EmpresaID).First(&periodo).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if periodo.Estado == domain.PeriodoLiquidado || periodo.Estado == domain.PeriodoCerrado {
		httpx.WriteError(w, h.Log, httpx.Validation("El período ya está liquidado/cerrado", nil))
		return
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// borra detalles previos
		if err := tx.Where("periodo_id = ?", periodo.ID).Delete(&domain.DetalleNomina{}).Error; err != nil {
			return err
		}
		var empleados []domain.Empleado
		if err := tx.Preload("Cargo").
			Where("empresa_id = ? AND estado = ?", a.EmpresaID, domain.EstadoActivo).
			Find(&empleados).Error; err != nil {
			return err
		}
		for _, e := range empleados {
			input := services.PayrollInput{Empleado: e}

			// agrega novedades aprobadas dentro del rango
			var novs []domain.Novedad
			tx.Where("empresa_id = ? AND empleado_id = ? AND estado = ? AND fecha_inicio BETWEEN ? AND ?",
				a.EmpresaID, e.ID, domain.NovedadAprobada, periodo.FechaInicio, periodo.FechaFin).
				Find(&novs)
			for _, n := range novs {
				switch n.Tipo {
				case domain.NovedadHorasExtraDiurna:
					input.HorasExtraDiurnas = input.HorasExtraDiurnas.Add(n.Cantidad)
				case domain.NovedadHorasExtraNocturna:
					input.HorasExtraNocturnas = input.HorasExtraNocturnas.Add(n.Cantidad)
				case domain.NovedadHorasExtraDominical:
					input.HorasExtraDominicales = input.HorasExtraDominicales.Add(n.Cantidad)
				case domain.NovedadBonificacion:
					input.Bonificaciones = input.Bonificaciones.Add(n.Monto)
				case domain.NovedadComision:
					input.Comisiones = input.Comisiones.Add(n.Monto)
				case domain.NovedadDeduccion, domain.NovedadPrestamo:
					input.OtrasDeducciones = input.OtrasDeducciones.Add(n.Monto)
				case domain.NovedadIncapacidad:
					input.DiasIncapacidad += int(n.Cantidad.IntPart())
				case domain.NovedadVacaciones:
					input.DiasVacaciones += int(n.Cantidad.IntPart())
				}
			}
			detalle := services.Calculate(&emp, input)
			detalle.PeriodoID = periodo.ID
			if err := tx.Create(&detalle).Error; err != nil {
				return err
			}
		}
		return recomputeTotales(tx, periodo.ID)
	})
	if err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	h.DB.Preload("Detalles.Empleado").First(&periodo, "id = ?", periodo.ID)
	httpx.OK(w, periodo)
}

// POST /api/nomina/periodos/{id}/liquidar
func (h *NominaHandler) Liquidar(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	id := chi.URLParam(r, "id")
	now := time.Now()
	res := h.DB.Model(&domain.PeriodoNomina{}).
		Where("id = ? AND empresa_id = ? AND estado IN ?", id, a.EmpresaID,
			[]domain.EstadoPeriodo{domain.PeriodoAbierto, domain.PeriodoEnLiquidacion}).
		Updates(map[string]any{
			"estado":       domain.PeriodoLiquidado,
			"liquidado_en": now,
		})
	if res.Error != nil {
		httpx.WriteError(w, h.Log, res.Error)
		return
	}
	if res.RowsAffected == 0 {
		httpx.WriteError(w, h.Log, httpx.NotFound("Período no encontrado o ya liquidado"))
		return
	}
	// marca novedades como APLICADAS
	h.DB.Model(&domain.Novedad{}).
		Where("empresa_id = ? AND estado = ?", a.EmpresaID, domain.NovedadAprobada).
		Update("estado", domain.NovedadAplicada)

	var p domain.PeriodoNomina
	h.DB.Preload("Detalles.Empleado").First(&p, "id = ?", id)
	httpx.OK(w, p)
}

func recomputeTotales(tx *gorm.DB, periodoID string) error {
	var detalles []domain.DetalleNomina
	if err := tx.Where("periodo_id = ?", periodoID).Find(&detalles).Error; err != nil {
		return err
	}
	tDev, tDed, tNeto := decimal.Zero, decimal.Zero, decimal.Zero
	for _, d := range detalles {
		tDev = tDev.Add(d.TotalDevengado)
		tDed = tDed.Add(d.TotalDeducciones)
		tNeto = tNeto.Add(d.Neto)
	}
	return tx.Model(&domain.PeriodoNomina{}).Where("id = ?", periodoID).Updates(map[string]any{
		"total_devengado":   tDev,
		"total_deducciones": tDed,
		"total_neto":        tNeto,
	}).Error
}
