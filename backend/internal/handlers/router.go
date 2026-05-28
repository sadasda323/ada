package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/hrco/backend/internal/config"
	"github.com/hrco/backend/internal/domain"
	"github.com/hrco/backend/internal/middleware"
	"github.com/hrco/backend/internal/utils/security"
)

// NewRouter wires every module behind a single chi router.
func NewRouter(cfg *config.Config, db *gorm.DB, log *zap.Logger, tm *security.TokenManager) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(middleware.Recoverer(log))
	r.Use(middleware.Logger(log))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.CORSOrigin, "http://localhost:5173", "http://127.0.0.1:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-Id"},
		ExposedHeaders:   []string{"Content-Disposition"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	auth := &AuthHandler{DB: db, Tokens: tm, Log: log}
	areas := &AreaHandler{DB: db, Log: log}
	cargos := &CargoHandler{DB: db, Log: log}
	empleados := &EmpleadoHandler{DB: db, Log: log}
	novedades := &NovedadHandler{DB: db, Log: log}
	nomina := &NominaHandler{DB: db, Log: log}
	dashboard := &DashboardHandler{DB: db, Log: log}
	reportes := &ReportHandler{DB: db, Log: log}
	usuarios := &UsuarioHandler{DB: db, Log: log}
	empresa := &EmpresaHandler{DB: db, Log: log}

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	r.Route("/api", func(api chi.Router) {
		// ── Auth público
		api.Route("/auth", func(a chi.Router) {
			a.Post("/register", auth.Register)
			a.Post("/login", auth.Login)
			a.Post("/refresh", auth.Refresh)

			a.Group(func(g chi.Router) {
				g.Use(middleware.RequireAuth(tm))
				g.Get("/me", auth.Me)
				g.Post("/logout", auth.Logout)
			})
		})

		// ── Resto requiere auth
		api.Group(func(p chi.Router) {
			p.Use(middleware.RequireAuth(tm))

			adminRRHH := middleware.RequireRole(domain.RolAdminEmpresa, domain.RolRRHH)
			adminRRHHContador := middleware.RequireRole(domain.RolAdminEmpresa, domain.RolRRHH, domain.RolContador)
			soloAdmin := middleware.RequireRole(domain.RolAdminEmpresa)

			// Dashboard
			p.Get("/dashboard", dashboard.KPIs)

			// Empresa
			p.Get("/empresa", empresa.Get)
			p.With(soloAdmin).Patch("/empresa", empresa.Update)

			// Áreas
			p.Get("/areas", areas.List)
			p.With(adminRRHH).Post("/areas", areas.Create)
			p.Get("/areas/{id}", areas.Get)
			p.With(adminRRHH).Put("/areas/{id}", areas.Update)
			p.With(adminRRHH).Delete("/areas/{id}", areas.Delete)

			// Cargos
			p.Get("/cargos", cargos.List)
			p.With(adminRRHH).Post("/cargos", cargos.Create)
			p.Get("/cargos/{id}", cargos.Get)
			p.With(adminRRHH).Put("/cargos/{id}", cargos.Update)
			p.With(adminRRHH).Delete("/cargos/{id}", cargos.Delete)

			// Empleados
			p.Get("/empleados", empleados.List)
			p.With(adminRRHH).Post("/empleados", empleados.Create)
			p.Get("/empleados/{id}", empleados.Get)
			p.With(adminRRHH).Put("/empleados/{id}", empleados.Update)
			p.With(adminRRHH).Delete("/empleados/{id}", empleados.Delete)

			// Novedades
			p.Get("/novedades", novedades.List)
			p.With(adminRRHH).Post("/novedades", novedades.Create)
			p.With(adminRRHH).Put("/novedades/{id}", novedades.Update)
			p.With(adminRRHH).Delete("/novedades/{id}", novedades.Delete)
			p.With(adminRRHH).Post("/novedades/{id}/aprobar", novedades.ChangeEstado(domain.NovedadAprobada))
			p.With(adminRRHH).Post("/novedades/{id}/rechazar", novedades.ChangeEstado(domain.NovedadRechazada))

			// Nómina
			p.Get("/nomina/periodos", nomina.Listar)
			p.With(adminRRHHContador).Post("/nomina/periodos", nomina.Generar)
			p.Get("/nomina/periodos/{id}", nomina.Detalle)
			p.With(adminRRHHContador).Post("/nomina/periodos/{id}/recalcular", nomina.Recalcular)
			p.With(adminRRHHContador).Post("/nomina/periodos/{id}/liquidar", nomina.Liquidar)

			// Reportes
			p.With(adminRRHHContador).Get("/reportes/empleados.csv", reportes.EmpleadosCSV)
			p.With(adminRRHHContador).Get("/reportes/nomina.csv", reportes.NominaCSV)

			// Usuarios
			p.With(soloAdmin).Get("/usuarios", usuarios.List)
			p.With(soloAdmin).Post("/usuarios", usuarios.Create)
			p.With(soloAdmin).Put("/usuarios/{id}", usuarios.Update)
			p.With(soloAdmin).Delete("/usuarios/{id}", usuarios.Delete)
		})
	})

	r.NotFound(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"success":false,"error":{"code":"NOT_FOUND","message":"Ruta no encontrada"}}`))
	})

	return r
}
