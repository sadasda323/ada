package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// Base contiene campos comunes y un UUID generado en BeforeCreate.
type Base struct {
	ID        string         `gorm:"type:varchar(36);primaryKey" json:"id"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (b *Base) BeforeCreate(_ *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.NewString()
	}
	return nil
}

// ─────────────────────────── Empresa ───────────────────────────

type Empresa struct {
	Base
	NIT             string `gorm:"size:30;uniqueIndex;not null" json:"nit"`
	RazonSocial     string `gorm:"size:200;not null" json:"razonSocial"`
	NombreComercial string `gorm:"size:200" json:"nombreComercial,omitempty"`
	Direccion       string `gorm:"size:300" json:"direccion,omitempty"`
	Telefono        string `gorm:"size:30" json:"telefono,omitempty"`
	Email           string `gorm:"size:120" json:"email,omitempty"`
	Ciudad          string `gorm:"size:100" json:"ciudad,omitempty"`
	Pais            string `gorm:"size:50;default:Colombia" json:"pais"`
	LogoURL         string `gorm:"size:500" json:"logoUrl,omitempty"`

	// Configuración de nómina (Colombia 2025 por defecto)
	SalarioMinimo         decimal.Decimal `gorm:"type:numeric(14,2);default:1423500" json:"salarioMinimo"`
	AuxilioTransporte     decimal.Decimal `gorm:"type:numeric(14,2);default:200000" json:"auxilioTransporte"`
	PorcentajeSalud       decimal.Decimal `gorm:"type:numeric(5,4);default:0.04" json:"porcentajeSalud"`
	PorcentajePension     decimal.Decimal `gorm:"type:numeric(5,4);default:0.04" json:"porcentajePension"`
	RecargoExtraDiurna    decimal.Decimal `gorm:"type:numeric(5,4);default:0.25" json:"recargoExtraDiurna"`
	RecargoExtraNocturna  decimal.Decimal `gorm:"type:numeric(5,4);default:0.75" json:"recargoExtraNocturna"`
	RecargoExtraDominical decimal.Decimal `gorm:"type:numeric(5,4);default:1.00" json:"recargoExtraDominical"`
	PeriodicidadNomina    Periodicidad    `gorm:"size:20;default:MENSUAL" json:"periodicidadNomina"`

	Activa bool `gorm:"default:true;index" json:"activa"`
}

func (Empresa) TableName() string { return "empresas" }

// ─────────────────────────── Usuario ───────────────────────────

type Usuario struct {
	Base
	EmpresaID    string     `gorm:"type:varchar(36);index;not null" json:"empresaId"`
	Empresa      *Empresa   `gorm:"foreignKey:EmpresaID" json:"-"`
	EmpleadoID   *string    `gorm:"type:varchar(36);uniqueIndex" json:"empleadoId,omitempty"`
	Empleado     *Empleado  `gorm:"foreignKey:EmpleadoID" json:"-"`
	Email        string     `gorm:"size:120;not null;index:idx_usuario_empresa_email,unique" json:"email"`
	PasswordHash string     `gorm:"size:255;not null" json:"-"`
	Nombre       string     `gorm:"size:100;not null" json:"nombre"`
	Apellido     string     `gorm:"size:100;not null" json:"apellido"`
	Rol          Rol        `gorm:"size:30;not null;default:EMPLEADO" json:"rol"`
	Activo       bool       `gorm:"default:true" json:"activo"`
	UltimoLogin  *time.Time `json:"ultimoLogin,omitempty"`

	// composite unique fix: GORM creará el índice único compuesto vía tag arriba
}

func (Usuario) TableName() string { return "usuarios" }

// ─────────────────────────── RefreshToken ───────────────────────────

type RefreshToken struct {
	Base
	TokenHash string     `gorm:"size:255;uniqueIndex;not null" json:"-"`
	UsuarioID string     `gorm:"type:varchar(36);index;not null" json:"usuarioId"`
	EmpresaID string     `gorm:"type:varchar(36);index;not null" json:"empresaId"`
	UserAgent string     `gorm:"size:255" json:"userAgent,omitempty"`
	IP        string     `gorm:"size:45" json:"ip,omitempty"`
	ExpiresAt time.Time  `gorm:"index;not null" json:"expiresAt"`
	RevokedAt *time.Time `json:"revokedAt,omitempty"`
}

func (RefreshToken) TableName() string { return "refresh_tokens" }

// ─────────────────────────── Area ───────────────────────────

type Area struct {
	Base
	EmpresaID   string `gorm:"type:varchar(36);index;not null;index:idx_area_empresa_nombre,unique" json:"empresaId"`
	Nombre      string `gorm:"size:120;not null;index:idx_area_empresa_nombre,unique" json:"nombre"`
	Descripcion string `gorm:"size:500" json:"descripcion,omitempty"`
	Activa      bool   `gorm:"default:true" json:"activa"`
}

func (Area) TableName() string { return "areas" }

// ─────────────────────────── Cargo ───────────────────────────

type Cargo struct {
	Base
	EmpresaID   string          `gorm:"type:varchar(36);index;not null;index:idx_cargo_empresa_nombre,unique" json:"empresaId"`
	Nombre      string          `gorm:"size:150;not null;index:idx_cargo_empresa_nombre,unique" json:"nombre"`
	Descripcion string          `gorm:"size:500" json:"descripcion,omitempty"`
	SalarioBase decimal.Decimal `gorm:"type:numeric(14,2);not null" json:"salarioBase"`
	Activo      bool            `gorm:"default:true" json:"activo"`
}

func (Cargo) TableName() string { return "cargos" }

// ─────────────────────────── Empleado ───────────────────────────

type Empleado struct {
	Base
	EmpresaID       string          `gorm:"type:varchar(36);index;not null;index:idx_emp_empresa_doc,unique" json:"empresaId"`
	AreaID          *string         `gorm:"type:varchar(36);index" json:"areaId,omitempty"`
	Area            *Area           `gorm:"foreignKey:AreaID" json:"area,omitempty"`
	CargoID         *string         `gorm:"type:varchar(36);index" json:"cargoId,omitempty"`
	Cargo           *Cargo          `gorm:"foreignKey:CargoID" json:"cargo,omitempty"`
	Documento       string          `gorm:"size:30;not null;index:idx_emp_empresa_doc,unique" json:"documento"`
	TipoDocumento   string          `gorm:"size:5;default:CC" json:"tipoDocumento"`
	Nombre          string          `gorm:"size:100;not null" json:"nombre"`
	Apellido        string          `gorm:"size:100;not null" json:"apellido"`
	Email           string          `gorm:"size:120" json:"email,omitempty"`
	Telefono        string          `gorm:"size:30" json:"telefono,omitempty"`
	Direccion       string          `gorm:"size:300" json:"direccion,omitempty"`
	FechaNacimiento *time.Time      `json:"fechaNacimiento,omitempty"`
	FechaIngreso    time.Time       `gorm:"not null" json:"fechaIngreso"`
	FechaRetiro     *time.Time      `json:"fechaRetiro,omitempty"`
	TipoContrato    TipoContrato    `gorm:"size:30;default:TERMINO_INDEFINIDO" json:"tipoContrato"`
	Salario         decimal.Decimal `gorm:"type:numeric(14,2);not null" json:"salario"`
	CuentaBancaria  string          `gorm:"size:30" json:"cuentaBancaria,omitempty"`
	Banco           string          `gorm:"size:60" json:"banco,omitempty"`
	EPS             string          `gorm:"size:60" json:"eps,omitempty"`
	ARL             string          `gorm:"size:60" json:"arl,omitempty"`
	Pension         string          `gorm:"size:60" json:"pension,omitempty"`
	Cesantias       string          `gorm:"size:60" json:"cesantias,omitempty"`
	Estado          EstadoEmpleado  `gorm:"size:20;default:ACTIVO;index" json:"estado"`
}

func (Empleado) TableName() string { return "empleados" }

func (e Empleado) NombreCompleto() string { return e.Nombre + " " + e.Apellido }

// ─────────────────────────── Periodos / Detalles de Nómina ───────────────────────────

type PeriodoNomina struct {
	Base
	EmpresaID        string          `gorm:"type:varchar(36);index;not null;index:idx_periodo_unique,unique" json:"empresaId"`
	Nombre           string          `gorm:"size:100;not null" json:"nombre"`
	FechaInicio      time.Time       `gorm:"not null;index:idx_periodo_unique,unique" json:"fechaInicio"`
	FechaFin         time.Time       `gorm:"not null;index:idx_periodo_unique,unique" json:"fechaFin"`
	Periodicidad     Periodicidad    `gorm:"size:20;default:MENSUAL" json:"periodicidad"`
	Estado           EstadoPeriodo   `gorm:"size:20;default:ABIERTO;index" json:"estado"`
	TotalDevengado   decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"totalDevengado"`
	TotalDeducciones decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"totalDeducciones"`
	TotalNeto        decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"totalNeto"`
	LiquidadoEn      *time.Time      `json:"liquidadoEn,omitempty"`
	Detalles         []DetalleNomina `gorm:"foreignKey:PeriodoID" json:"detalles,omitempty"`
}

func (PeriodoNomina) TableName() string { return "periodos_nomina" }

type DetalleNomina struct {
	Base
	PeriodoID  string    `gorm:"type:varchar(36);index;not null;index:idx_detalle_unique,unique" json:"periodoId"`
	EmpleadoID string    `gorm:"type:varchar(36);index;not null;index:idx_detalle_unique,unique" json:"empleadoId"`
	Empleado   *Empleado `gorm:"foreignKey:EmpleadoID" json:"empleado,omitempty"`

	// Devengado
	SalarioBase           decimal.Decimal `gorm:"type:numeric(14,2);not null" json:"salarioBase"`
	DiasTrabajados        int             `gorm:"default:30" json:"diasTrabajados"`
	AuxilioTransporte     decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"auxilioTransporte"`
	HorasExtraDiurnas     decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"horasExtraDiurnas"`
	HorasExtraNocturnas   decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"horasExtraNocturnas"`
	HorasExtraDominicales decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"horasExtraDominicales"`
	Bonificaciones        decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"bonificaciones"`
	Comisiones            decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"comisiones"`
	TotalDevengado        decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"totalDevengado"`

	// Deducciones
	Salud            decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"salud"`
	Pension          decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"pension"`
	RetencionFuente  decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"retencionFuente"`
	OtrasDeducciones decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"otrasDeducciones"`
	TotalDeducciones decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"totalDeducciones"`

	// Neto
	Neto          decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"neto"`
	Observaciones string          `gorm:"size:500" json:"observaciones,omitempty"`
}

func (DetalleNomina) TableName() string { return "detalles_nomina" }

// ─────────────────────────── Novedad ───────────────────────────

type Novedad struct {
	Base
	EmpresaID   string          `gorm:"type:varchar(36);index;not null" json:"empresaId"`
	EmpleadoID  string          `gorm:"type:varchar(36);index;not null" json:"empleadoId"`
	Empleado    *Empleado       `gorm:"foreignKey:EmpleadoID" json:"empleado,omitempty"`
	Tipo        TipoNovedad     `gorm:"size:30;not null;index" json:"tipo"`
	FechaInicio time.Time       `gorm:"not null" json:"fechaInicio"`
	FechaFin    *time.Time      `json:"fechaFin,omitempty"`
	Cantidad    decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"cantidad"` // horas, días, etc.
	Monto       decimal.Decimal `gorm:"type:numeric(14,2);default:0" json:"monto"`
	Descripcion string          `gorm:"size:500" json:"descripcion,omitempty"`
	Estado      EstadoNovedad   `gorm:"size:20;default:PENDIENTE;index" json:"estado"`
	AplicadaEn  *time.Time      `json:"aplicadaEn,omitempty"`
}

func (Novedad) TableName() string { return "novedades" }
