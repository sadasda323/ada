package services

import (
	"github.com/shopspring/decimal"

	"github.com/hrco/backend/internal/domain"
)

// HoraInput se calcula a partir del salario mensual: hora ordinaria = salario / 240 (8h x 30d).
const horasMensualesEstandar = 240

// PayrollInput agrupa los datos para liquidar un detalle de nómina.
type PayrollInput struct {
	Empleado domain.Empleado
	// Acumulado de novedades para el período
	HorasExtraDiurnas     decimal.Decimal
	HorasExtraNocturnas   decimal.Decimal
	HorasExtraDominicales decimal.Decimal
	Bonificaciones        decimal.Decimal
	Comisiones            decimal.Decimal
	OtrasDeducciones      decimal.Decimal
	DiasIncapacidad       int
	DiasVacaciones        int
}

// Calculate aplica reglas de Colombia 2025 con configuración por empresa.
// Retorna un DetalleNomina (sin PeriodoID/EmpleadoID) listo para persistir.
func Calculate(emp *domain.Empresa, in PayrollInput) domain.DetalleNomina {
	salario := in.Empleado.Salario
	if salario.IsZero() {
		// si no hay salario, intenta usar el del cargo
		if in.Empleado.Cargo != nil {
			salario = in.Empleado.Cargo.SalarioBase
		}
	}

	dias := 30 - in.DiasIncapacidad - in.DiasVacaciones
	if dias < 0 {
		dias = 0
	}

	salarioProporcional := salario.Mul(decimal.NewFromInt(int64(dias))).Div(decimal.NewFromInt(30))

	// Auxilio de transporte si salario ≤ 2 SMMLV
	aux := decimal.Zero
	if !emp.SalarioMinimo.IsZero() && salario.LessThanOrEqual(emp.SalarioMinimo.Mul(decimal.NewFromInt(2))) {
		aux = emp.AuxilioTransporte.Mul(decimal.NewFromInt(int64(dias))).Div(decimal.NewFromInt(30))
	}

	horaOrdinaria := decimal.Zero
	if !salario.IsZero() {
		horaOrdinaria = salario.Div(decimal.NewFromInt(horasMensualesEstandar))
	}

	heDiurna := in.HorasExtraDiurnas.Mul(horaOrdinaria.Mul(decimal.NewFromInt(1).Add(emp.RecargoExtraDiurna)))
	heNocturna := in.HorasExtraNocturnas.Mul(horaOrdinaria.Mul(decimal.NewFromInt(1).Add(emp.RecargoExtraNocturna)))
	heDominical := in.HorasExtraDominicales.Mul(horaOrdinaria.Mul(decimal.NewFromInt(1).Add(emp.RecargoExtraDominical)))

	totalDevengado := salarioProporcional.
		Add(aux).
		Add(heDiurna).
		Add(heNocturna).
		Add(heDominical).
		Add(in.Bonificaciones).
		Add(in.Comisiones).
		Round(2)

	// Base IBC para salud/pensión = devengado SIN auxilio de transporte
	baseIBC := totalDevengado.Sub(aux)
	if baseIBC.IsNegative() {
		baseIBC = decimal.Zero
	}
	salud := baseIBC.Mul(emp.PorcentajeSalud).Round(2)
	pension := baseIBC.Mul(emp.PorcentajePension).Round(2)
	totalDed := salud.Add(pension).Add(in.OtrasDeducciones).Round(2)

	neto := totalDevengado.Sub(totalDed).Round(2)

	return domain.DetalleNomina{
		EmpleadoID:            in.Empleado.ID,
		SalarioBase:           salario,
		DiasTrabajados:        dias,
		AuxilioTransporte:     aux.Round(2),
		HorasExtraDiurnas:     heDiurna.Round(2),
		HorasExtraNocturnas:   heNocturna.Round(2),
		HorasExtraDominicales: heDominical.Round(2),
		Bonificaciones:        in.Bonificaciones.Round(2),
		Comisiones:            in.Comisiones.Round(2),
		TotalDevengado:        totalDevengado,
		Salud:                 salud,
		Pension:               pension,
		OtrasDeducciones:      in.OtrasDeducciones.Round(2),
		TotalDeducciones:      totalDed,
		Neto:                  neto,
	}
}
