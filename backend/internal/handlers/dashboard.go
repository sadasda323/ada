package handlers

import (
	"net/http"
	"time"

	"github.com/shopspring/decimal"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/hrco/backend/internal/domain"
	"github.com/hrco/backend/internal/middleware"
	"github.com/hrco/backend/internal/utils/httpx"
)

type DashboardHandler struct {
	DB  *gorm.DB
	Log *zap.Logger
}

type kpiResponse struct {
	EmpleadosActivos     int64           `json:"empleadosActivos"`
	NominaDelMes         decimal.Decimal `json:"nominaDelMes"`
	NovedadesPendientes  int64           `json:"novedadesPendientes"`
	CrecimientoEmpleados float64         `json:"crecimientoEmpleados"`
	TotalEmpleados       int64           `json:"totalEmpleados"`
	TotalAreas           int64           `json:"totalAreas"`
	TotalCargos          int64           `json:"totalCargos"`
	UltimoPeriodo        any             `json:"ultimoPeriodo,omitempty"`
}

// GET /api/dashboard
func (h *DashboardHandler) KPIs(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	out := kpiResponse{}

	h.DB.Model(&domain.Empleado{}).
		Where("empresa_id = ? AND estado = ?", a.EmpresaID, domain.EstadoActivo).
		Count(&out.EmpleadosActivos)

	h.DB.Model(&domain.Empleado{}).
		Where("empresa_id = ?", a.EmpresaID).
		Count(&out.TotalEmpleados)

	h.DB.Model(&domain.Area{}).
		Where("empresa_id = ?", a.EmpresaID).Count(&out.TotalAreas)

	h.DB.Model(&domain.Cargo{}).
		Where("empresa_id = ?", a.EmpresaID).Count(&out.TotalCargos)

	h.DB.Model(&domain.Novedad{}).
		Where("empresa_id = ? AND estado = ?", a.EmpresaID, domain.NovedadPendiente).
		Count(&out.NovedadesPendientes)

	now := time.Now()
	startMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endMonth := startMonth.AddDate(0, 1, 0)

	var periodo domain.PeriodoNomina
	if err := h.DB.Where("empresa_id = ? AND fecha_inicio >= ? AND fecha_fin < ?",
		a.EmpresaID, startMonth, endMonth).
		Order("fecha_inicio desc").First(&periodo).Error; err == nil {
		out.NominaDelMes = periodo.TotalNeto
	}

	var ultimo domain.PeriodoNomina
	if err := h.DB.Where("empresa_id = ?", a.EmpresaID).
		Order("fecha_inicio desc").First(&ultimo).Error; err == nil {
		out.UltimoPeriodo = ultimo
	}

	// Crecimiento: empleados creados en mes actual vs mes anterior
	prevStart := startMonth.AddDate(0, -1, 0)
	var thisM, prevM int64
	h.DB.Model(&domain.Empleado{}).
		Where("empresa_id = ? AND created_at >= ? AND created_at < ?", a.EmpresaID, startMonth, endMonth).
		Count(&thisM)
	h.DB.Model(&domain.Empleado{}).
		Where("empresa_id = ? AND created_at >= ? AND created_at < ?", a.EmpresaID, prevStart, startMonth).
		Count(&prevM)
	if prevM > 0 {
		out.CrecimientoEmpleados = (float64(thisM-prevM) / float64(prevM)) * 100
	}

	httpx.OK(w, out)
}
