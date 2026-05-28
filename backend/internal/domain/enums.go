package domain

// Rol del usuario en el sistema
type Rol string

const (
	RolAdminEmpresa Rol = "ADMIN_EMPRESA"
	RolRRHH         Rol = "RRHH"
	RolContador     Rol = "CONTADOR"
	RolEmpleado     Rol = "EMPLEADO"
)

func (r Rol) Valid() bool {
	switch r {
	case RolAdminEmpresa, RolRRHH, RolContador, RolEmpleado:
		return true
	}
	return false
}

type EstadoEmpleado string

const (
	EstadoActivo      EstadoEmpleado = "ACTIVO"
	EstadoInactivo    EstadoEmpleado = "INACTIVO"
	EstadoVacaciones  EstadoEmpleado = "VACACIONES"
	EstadoIncapacidad EstadoEmpleado = "INCAPACIDAD"
	EstadoRetirado    EstadoEmpleado = "RETIRADO"
)

type TipoContrato string

const (
	ContratoFijo            TipoContrato = "TERMINO_FIJO"
	ContratoIndefinido      TipoContrato = "TERMINO_INDEFINIDO"
	ContratoObraLabor       TipoContrato = "OBRA_O_LABOR"
	ContratoPrestacion      TipoContrato = "PRESTACION_SERVICIOS"
	ContratoAprendizaje     TipoContrato = "APRENDIZAJE"
)

type TipoNovedad string

const (
	NovedadIncapacidad        TipoNovedad = "INCAPACIDAD"
	NovedadVacaciones         TipoNovedad = "VACACIONES"
	NovedadHorasExtraDiurna   TipoNovedad = "HORAS_EXTRA_DIURNA"
	NovedadHorasExtraNocturna TipoNovedad = "HORAS_EXTRA_NOCTURNA"
	NovedadHorasExtraDominical TipoNovedad = "HORAS_EXTRA_DOMINICAL"
	NovedadBonificacion       TipoNovedad = "BONIFICACION"
	NovedadComision           TipoNovedad = "COMISION"
	NovedadDeduccion          TipoNovedad = "DEDUCCION"
	NovedadPrestamo           TipoNovedad = "PRESTAMO"
	NovedadLicencia           TipoNovedad = "LICENCIA"
	NovedadAusencia           TipoNovedad = "AUSENCIA"
)

type EstadoNovedad string

const (
	NovedadPendiente EstadoNovedad = "PENDIENTE"
	NovedadAprobada  EstadoNovedad = "APROBADA"
	NovedadRechazada EstadoNovedad = "RECHAZADA"
	NovedadAplicada  EstadoNovedad = "APLICADA"
)

type EstadoPeriodo string

const (
	PeriodoAbierto       EstadoPeriodo = "ABIERTO"
	PeriodoEnLiquidacion EstadoPeriodo = "EN_LIQUIDACION"
	PeriodoLiquidado     EstadoPeriodo = "LIQUIDADO"
	PeriodoCerrado       EstadoPeriodo = "CERRADO"
)

type Periodicidad string

const (
	PeriodicidadQuincenal Periodicidad = "QUINCENAL"
	PeriodicidadMensual   Periodicidad = "MENSUAL"
)
