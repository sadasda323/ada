package services

import (
	"testing"

	"github.com/shopspring/decimal"
	"github.com/stretchr/testify/assert"

	"github.com/hrco/backend/internal/domain"
)

func defaultEmpresa() *domain.Empresa {
	return &domain.Empresa{
		SalarioMinimo:         decimal.NewFromInt(1423500),
		AuxilioTransporte:     decimal.NewFromInt(200000),
		PorcentajeSalud:       decimal.NewFromFloat(0.04),
		PorcentajePension:     decimal.NewFromFloat(0.04),
		RecargoExtraDiurna:    decimal.NewFromFloat(0.25),
		RecargoExtraNocturna:  decimal.NewFromFloat(0.75),
		RecargoExtraDominical: decimal.NewFromFloat(1.00),
	}
}

func TestCalculate_BasicSalary_AppliesAuxAndDeductions(t *testing.T) {
	emp := defaultEmpresa()
	in := PayrollInput{
		Empleado: domain.Empleado{
			Salario: decimal.NewFromInt(2000000),
		},
	}
	d := Calculate(emp, in)

	// Salario base completo
	assert.True(t, decimal.NewFromInt(2000000).Equal(d.SalarioBase))
	// Auxilio transporte aplica (≤ 2 SMMLV)
	assert.True(t, decimal.NewFromInt(200000).Equal(d.AuxilioTransporte))
	// Devengado = 2.000.000 + 200.000
	assert.True(t, decimal.NewFromInt(2200000).Equal(d.TotalDevengado))
	// IBC = 2.000.000 → salud = 80.000, pensión = 80.000
	assert.True(t, decimal.NewFromInt(80000).Equal(d.Salud))
	assert.True(t, decimal.NewFromInt(80000).Equal(d.Pension))
	assert.True(t, decimal.NewFromInt(160000).Equal(d.TotalDeducciones))
	// Neto = 2.040.000
	assert.True(t, decimal.NewFromInt(2040000).Equal(d.Neto))
}

func TestCalculate_HighSalary_NoAuxTransporte(t *testing.T) {
	emp := defaultEmpresa()
	in := PayrollInput{
		Empleado: domain.Empleado{
			Salario: decimal.NewFromInt(5000000),
		},
	}
	d := Calculate(emp, in)
	assert.True(t, d.AuxilioTransporte.IsZero(), "no debe haber auxilio si salario > 2 SMMLV")
	// Salud y pensión = 5.000.000 * 0.04
	assert.True(t, decimal.NewFromInt(200000).Equal(d.Salud))
	assert.True(t, decimal.NewFromInt(200000).Equal(d.Pension))
	assert.True(t, decimal.NewFromInt(4600000).Equal(d.Neto))
}

func TestCalculate_HorasExtraDiurnas(t *testing.T) {
	emp := defaultEmpresa()
	// Salario 2.400.000 → hora ordinaria = 10.000
	in := PayrollInput{
		Empleado: domain.Empleado{
			Salario: decimal.NewFromInt(2400000),
		},
		HorasExtraDiurnas: decimal.NewFromInt(10), // 10 horas * 12.500 = 125.000
	}
	d := Calculate(emp, in)
	// 10h * (10000 * 1.25) = 125.000
	assert.True(t, decimal.NewFromInt(125000).Equal(d.HorasExtraDiurnas))
}

func TestCalculate_DiasIncapacidad_ReducesSalary(t *testing.T) {
	emp := defaultEmpresa()
	in := PayrollInput{
		Empleado: domain.Empleado{
			Salario: decimal.NewFromInt(3000000),
		},
		DiasIncapacidad: 5,
	}
	d := Calculate(emp, in)
	assert.Equal(t, 25, d.DiasTrabajados)
	// Salario proporcional = 3.000.000 * 25/30 = 2.500.000
	assert.True(t, decimal.NewFromInt(2500000).Equal(d.TotalDevengado.Sub(d.AuxilioTransporte)))
}

func TestCalculate_OtrasDeducciones(t *testing.T) {
	emp := defaultEmpresa()
	in := PayrollInput{
		Empleado:         domain.Empleado{Salario: decimal.NewFromInt(2000000)},
		OtrasDeducciones: decimal.NewFromInt(150000),
	}
	d := Calculate(emp, in)
	// Neto = 2.200.000 - 80.000 - 80.000 - 150.000 = 1.890.000
	assert.True(t, decimal.NewFromInt(1890000).Equal(d.Neto))
}
