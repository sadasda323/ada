# HRCO — Sistema de Gestión de RRHH y Nómina

Sistema profesional multi-tenant para gestión de empleados, cargos, áreas, novedades y nómina (Colombia 2025).

## Stack

**Backend**
- Go 1.22
- chi v5 (router HTTP)
- GORM v2 + PostgreSQL 16
- JWT (access + refresh) con golang-jwt/jwt v5 + bcrypt
- go-playground/validator v10
- zap (logging estructurado)
- shopspring/decimal (cálculos de nómina con precisión)
- testify + httptest

**Frontend**
- React 18 + TypeScript
- Vite 5
- TailwindCSS 3
- React Router 6
- TanStack Query 5
- Zustand
- React Hook Form + Zod
- Axios con refresh token automático
- Vitest + Testing Library

**Infra**
- Docker + docker-compose (Postgres + backend Go + frontend nginx)

## Estructura

```
.
├── backend/         # API Go
│   ├── cmd/api/             # entrypoint
│   ├── cmd/seed/            # seed
│   └── internal/
│       ├── config/          # env, logger
│       ├── db/              # conexión, migraciones
│       ├── domain/          # modelos GORM
│       ├── handlers/        # HTTP handlers por módulo
│       ├── middleware/      # auth, cors, recover, logger
│       ├── services/        # lógica de negocio (nómina, etc.)
│       └── utils/           # errores, jwt, response, validator
├── frontend/        # SPA React
├── docker-compose.yml
└── README.md
```

## Inicio rápido — Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up -d --build
docker compose exec backend /app/seed
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Postgres: localhost:5432

## Inicio rápido — Local

Requiere Go 1.22+, Node 20+ y Postgres 16 corriendo.

```bash
# Backend
cd backend
cp .env.example .env
go mod download
go run ./cmd/api

# Seed (otra terminal)
go run ./cmd/seed

# Frontend (otra terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Credenciales demo (después del seed)

- **Empresa**: HRCO Demo S.A.S
- **Admin**: `admin@hrco.test` / `Admin123!`
- **Empleado**: `empleado@hrco.test` / `Empleado123!`

## Módulos

| Módulo | Descripción |
|---|---|
| Auth | Registro de empresa + admin, login, refresh, roles |
| Empleados | CRUD, asignación cargo/área, salario, estado |
| Cargos | CRUD con salario base |
| Áreas | CRUD de departamentos |
| Novedades | Incapacidades, vacaciones, horas extra, bonos, deducciones |
| Nómina | Generación de período, cálculo (salud/pensión/aux. transporte/horas extra/novedades), liquidación |
| Dashboard | KPIs reales (empleados activos, nómina del mes, novedades pendientes, crecimiento) |
| Reportes | Filtros + exportación CSV |
| Configuración | Datos de la empresa |
| Usuarios | Gestión de cuentas y roles |

## Reglas de nómina (Colombia 2025)

- Salario mínimo: $1.423.500
- Auxilio de transporte: $200.000 (si salario ≤ 2 SMMLV)
- Salud empleado: 4%
- Pensión empleado: 4%
- Hora extra diurna: recargo 25%
- Hora extra nocturna: recargo 75%
- Hora extra dominical/festiva: recargo 100%

Configurables por empresa en `Configuración`.

## Tests

```bash
cd backend && go test ./...
cd frontend && npm test
```

## Licencia

MIT
