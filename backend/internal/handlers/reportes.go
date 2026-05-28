package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/hrco/backend/internal/domain"
	"github.com/hrco/backend/internal/middleware"
	"github.com/hrco/backend/internal/utils/httpx"
)

type ReportHandler struct {
	DB  *gorm.DB
	Log *zap.Logger
}

// GET /api/reportes/empleados.csv
func (h *ReportHandler) EmpleadosCSV(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	var emps []domain.Empleado
	q := h.DB.Preload("Area").Preload("Cargo").Where("empresa_id = ?", a.EmpresaID)
	if estado := r.URL.Query().Get("estado"); estado != "" {
		q = q.Where("estado = ?", estado)
	}
	if err := q.Order("created_at desc").Find(&emps).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="empleados.csv"`)
	wr := csv.NewWriter(w)
	defer wr.Flush()
	_ = wr.Write([]string{"Documento", "Nombre", "Apellido", "Email", "Area", "Cargo", "Salario", "Estado", "FechaIngreso"})
	for _, e := range emps {
		area := ""
		if e.Area != nil {
			area = e.Area.Nombre
		}
		cargo := ""
		if e.Cargo != nil {
			cargo = e.Cargo.Nombre
		}
		_ = wr.Write([]string{
			e.Documento, e.Nombre, e.Apellido, e.Email, area, cargo,
			e.Salario.String(), string(e.Estado), e.FechaIngreso.Format("2006-01-02"),
		})
	}
}

// GET /api/reportes/nomina.csv?periodoId=...
func (h *ReportHandler) NominaCSV(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	periodoID := r.URL.Query().Get("periodoId")
	if periodoID == "" {
		httpx.WriteError(w, h.Log, httpx.BadRequest("periodoId es requerido", nil))
		return
	}
	var periodo domain.PeriodoNomina
	if err := h.DB.Where("id = ? AND empresa_id = ?", periodoID, a.EmpresaID).First(&periodo).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	var detalles []domain.DetalleNomina
	if err := h.DB.Preload("Empleado").Where("periodo_id = ?", periodoID).Find(&detalles).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="nomina_%s.csv"`, time.Now().Format("20060102")))
	wr := csv.NewWriter(w)
	defer wr.Flush()
	_ = wr.Write([]string{
		"Documento", "Empleado", "SalarioBase", "Dias", "AuxTransporte",
		"HEDiurnas", "HENocturnas", "HEDominicales", "Bonif", "Comis",
		"TotalDev", "Salud", "Pension", "OtrasDed", "TotalDed", "Neto",
	})
	for _, d := range detalles {
		nombre := ""
		doc := ""
		if d.Empleado != nil {
			nombre = d.Empleado.NombreCompleto()
			doc = d.Empleado.Documento
		}
		_ = wr.Write([]string{
			doc, nombre,
			d.SalarioBase.String(), fmt.Sprintf("%d", d.DiasTrabajados), d.AuxilioTransporte.String(),
			d.HorasExtraDiurnas.String(), d.HorasExtraNocturnas.String(), d.HorasExtraDominicales.String(),
			d.Bonificaciones.String(), d.Comisiones.String(),
			d.TotalDevengado.String(),
			d.Salud.String(), d.Pension.String(), d.OtrasDeducciones.String(), d.TotalDeducciones.String(),
			d.Neto.String(),
		})
	}
}
