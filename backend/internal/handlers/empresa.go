package handlers

import (
	"net/http"

	"github.com/shopspring/decimal"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/hrco/backend/internal/domain"
	"github.com/hrco/backend/internal/middleware"
	"github.com/hrco/backend/internal/utils/httpx"
	"github.com/hrco/backend/internal/utils/validate"
)

type EmpresaHandler struct {
	DB  *gorm.DB
	Log *zap.Logger
}

type empresaUpdateDTO struct {
	RazonSocial           string              `json:"razonSocial" validate:"omitempty,min=2,max=200"`
	NombreComercial       string              `json:"nombreComercial" validate:"omitempty,max=200"`
	Direccion             string              `json:"direccion" validate:"omitempty,max=300"`
	Telefono              string              `json:"telefono" validate:"omitempty,max=30"`
	Email                 string              `json:"email" validate:"omitempty,email"`
	Ciudad                string              `json:"ciudad" validate:"omitempty,max=100"`
	LogoURL               string              `json:"logoUrl" validate:"omitempty,max=500"`
	SalarioMinimo         *decimal.Decimal    `json:"salarioMinimo,omitempty"`
	AuxilioTransporte     *decimal.Decimal    `json:"auxilioTransporte,omitempty"`
	PorcentajeSalud       *decimal.Decimal    `json:"porcentajeSalud,omitempty"`
	PorcentajePension     *decimal.Decimal    `json:"porcentajePension,omitempty"`
	RecargoExtraDiurna    *decimal.Decimal    `json:"recargoExtraDiurna,omitempty"`
	RecargoExtraNocturna  *decimal.Decimal    `json:"recargoExtraNocturna,omitempty"`
	RecargoExtraDominical *decimal.Decimal    `json:"recargoExtraDominical,omitempty"`
	PeriodicidadNomina    domain.Periodicidad `json:"periodicidadNomina,omitempty"`
}

func (h *EmpresaHandler) Get(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	var emp domain.Empresa
	if err := h.DB.First(&emp, "id = ?", a.EmpresaID).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.OK(w, emp)
}

func (h *EmpresaHandler) Update(w http.ResponseWriter, r *http.Request) {
	a := middleware.FromContext(r.Context())
	var in empresaUpdateDTO
	if err := httpx.DecodeJSON(r, &in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if err := validate.Struct(in); err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	var emp domain.Empresa
	if err := h.DB.First(&emp, "id = ?", a.EmpresaID).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	if in.RazonSocial != "" {
		emp.RazonSocial = in.RazonSocial
	}
	if in.NombreComercial != "" {
		emp.NombreComercial = in.NombreComercial
	}
	if in.Direccion != "" {
		emp.Direccion = in.Direccion
	}
	if in.Telefono != "" {
		emp.Telefono = in.Telefono
	}
	if in.Email != "" {
		emp.Email = in.Email
	}
	if in.Ciudad != "" {
		emp.Ciudad = in.Ciudad
	}
	if in.LogoURL != "" {
		emp.LogoURL = in.LogoURL
	}
	if in.SalarioMinimo != nil {
		emp.SalarioMinimo = *in.SalarioMinimo
	}
	if in.AuxilioTransporte != nil {
		emp.AuxilioTransporte = *in.AuxilioTransporte
	}
	if in.PorcentajeSalud != nil {
		emp.PorcentajeSalud = *in.PorcentajeSalud
	}
	if in.PorcentajePension != nil {
		emp.PorcentajePension = *in.PorcentajePension
	}
	if in.RecargoExtraDiurna != nil {
		emp.RecargoExtraDiurna = *in.RecargoExtraDiurna
	}
	if in.RecargoExtraNocturna != nil {
		emp.RecargoExtraNocturna = *in.RecargoExtraNocturna
	}
	if in.RecargoExtraDominical != nil {
		emp.RecargoExtraDominical = *in.RecargoExtraDominical
	}
	if in.PeriodicidadNomina != "" {
		emp.PeriodicidadNomina = in.PeriodicidadNomina
	}
	if err := h.DB.Save(&emp).Error; err != nil {
		httpx.WriteError(w, h.Log, err)
		return
	}
	httpx.OK(w, emp)
}
