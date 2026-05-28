package seed

import (
	"errors"
	"time"

	"github.com/shopspring/decimal"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/hrco/backend/internal/domain"
	"github.com/hrco/backend/internal/utils/security"
)

// Run inserts demo data only if the demo company doesn't exist yet.
func Run(db *gorm.DB, log *zap.Logger) error {
	var existing domain.Empresa
	err := db.Where("nit = ?", "900123456-7").First(&existing).Error
	if err == nil {
		log.Info("seed: empresa demo ya existe, omitiendo")
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	log.Info("seed: creando datos demo...")

	emp := domain.Empresa{
		NIT:                   "900123456-7",
		RazonSocial:           "HRCO Demo S.A.S",
		NombreComercial:       "HRCO Demo",
		Direccion:             "Cra 7 # 71-21, Bogotá",
		Telefono:              "+57 601 555 1234",
		Email:                 "contacto@hrco.test",
		Ciudad:                "Bogotá",
		Pais:                  "Colombia",
		SalarioMinimo:         decimal.NewFromInt(1423500),
		AuxilioTransporte:     decimal.NewFromInt(200000),
		PorcentajeSalud:       decimal.NewFromFloat(0.04),
		PorcentajePension:     decimal.NewFromFloat(0.04),
		RecargoExtraDiurna:    decimal.NewFromFloat(0.25),
		RecargoExtraNocturna:  decimal.NewFromFloat(0.75),
		RecargoExtraDominical: decimal.NewFromFloat(1.00),
		PeriodicidadNomina:    domain.PeriodicidadMensual,
		Activa:                true,
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&emp).Error; err != nil {
			return err
		}

		// Áreas
		areas := []domain.Area{
			{EmpresaID: emp.ID, Nombre: "Tecnología", Descripcion: "Desarrollo y operaciones", Activa: true},
			{EmpresaID: emp.ID, Nombre: "Recursos Humanos", Descripcion: "Gestión de personal", Activa: true},
			{EmpresaID: emp.ID, Nombre: "Ventas", Descripcion: "Comercial y atención al cliente", Activa: true},
			{EmpresaID: emp.ID, Nombre: "Finanzas", Descripcion: "Contabilidad y tesorería", Activa: true},
		}
		if err := tx.Create(&areas).Error; err != nil {
			return err
		}

		// Cargos
		cargos := []domain.Cargo{
			{EmpresaID: emp.ID, Nombre: "Desarrollador Senior", SalarioBase: decimal.NewFromInt(6500000), Activo: true},
			{EmpresaID: emp.ID, Nombre: "Desarrollador Junior", SalarioBase: decimal.NewFromInt(3500000), Activo: true},
			{EmpresaID: emp.ID, Nombre: "Analista RRHH", SalarioBase: decimal.NewFromInt(3200000), Activo: true},
			{EmpresaID: emp.ID, Nombre: "Ejecutivo de Ventas", SalarioBase: decimal.NewFromInt(2800000), Activo: true},
			{EmpresaID: emp.ID, Nombre: "Contador", SalarioBase: decimal.NewFromInt(4200000), Activo: true},
		}
		if err := tx.Create(&cargos).Error; err != nil {
			return err
		}

		// Empleados (uno por cargo)
		fechaIng := time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC)
		emps := []domain.Empleado{
			{EmpresaID: emp.ID, Documento: "1010123456", TipoDocumento: "CC", Nombre: "Dilan", Apellido: "Test",
				Email: "empleado@hrco.test", FechaIngreso: fechaIng, TipoContrato: domain.ContratoIndefinido,
				Salario: cargos[0].SalarioBase, AreaID: &areas[0].ID, CargoID: &cargos[0].ID, Estado: domain.EstadoActivo,
				EPS: "Sura", ARL: "Positiva", Pension: "Porvenir"},
			{EmpresaID: emp.ID, Documento: "1020234567", TipoDocumento: "CC", Nombre: "María", Apellido: "Gómez",
				Email: "maria.gomez@hrco.test", FechaIngreso: fechaIng, TipoContrato: domain.ContratoIndefinido,
				Salario: cargos[1].SalarioBase, AreaID: &areas[0].ID, CargoID: &cargos[1].ID, Estado: domain.EstadoActivo},
			{EmpresaID: emp.ID, Documento: "1030345678", TipoDocumento: "CC", Nombre: "Carlos", Apellido: "Rodríguez",
				Email: "carlos.rodriguez@hrco.test", FechaIngreso: fechaIng, TipoContrato: domain.ContratoIndefinido,
				Salario: cargos[2].SalarioBase, AreaID: &areas[1].ID, CargoID: &cargos[2].ID, Estado: domain.EstadoActivo},
			{EmpresaID: emp.ID, Documento: "1040456789", TipoDocumento: "CC", Nombre: "Laura", Apellido: "Pérez",
				Email: "laura.perez@hrco.test", FechaIngreso: fechaIng, TipoContrato: domain.ContratoFijo,
				Salario: cargos[3].SalarioBase, AreaID: &areas[2].ID, CargoID: &cargos[3].ID, Estado: domain.EstadoActivo},
			{EmpresaID: emp.ID, Documento: "1050567890", TipoDocumento: "CC", Nombre: "Andrés", Apellido: "Mejía",
				Email: "andres.mejia@hrco.test", FechaIngreso: fechaIng, TipoContrato: domain.ContratoIndefinido,
				Salario: cargos[4].SalarioBase, AreaID: &areas[3].ID, CargoID: &cargos[4].ID, Estado: domain.EstadoActivo},
		}
		if err := tx.Create(&emps).Error; err != nil {
			return err
		}

		// Usuarios
		hashAdmin, _ := security.HashPassword("Admin123!")
		hashEmp, _ := security.HashPassword("Empleado123!")

		users := []domain.Usuario{
			{EmpresaID: emp.ID, Email: "admin@hrco.test", PasswordHash: hashAdmin,
				Nombre: "Admin", Apellido: "HRCO", Rol: domain.RolAdminEmpresa, Activo: true},
			{EmpresaID: emp.ID, Email: "empleado@hrco.test", PasswordHash: hashEmp,
				Nombre: "Dilan", Apellido: "Test", Rol: domain.RolEmpleado, Activo: true,
				EmpleadoID: &emps[0].ID},
		}
		if err := tx.Create(&users).Error; err != nil {
			return err
		}

		log.Info("seed: completado",
			zap.String("empresaId", emp.ID),
			zap.Int("empleados", len(emps)),
			zap.Int("usuarios", len(users)),
		)
		return nil
	})
}
