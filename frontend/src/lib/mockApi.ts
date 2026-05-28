// Mock data + interceptor para modo desarrollo sin backend.
// Activa con VITE_DEV_NOAUTH=1 en .env.
import type { AxiosRequestConfig } from 'axios';
import { api } from './api';
import { useAuthStore } from '@/stores/auth.store';
import type {
  Area, Cargo, DashboardKPIs, Empleado, Empresa, Novedad, PeriodoNomina, User,
} from '@/types';

const now = new Date().toISOString();
const today = new Date().toISOString().slice(0, 10) + 'T00:00:00Z';

const empresa: Empresa = {
  id: 'emp-1', nit: '900123456-7', razonSocial: 'HRCO Demo S.A.S',
  nombreComercial: 'HRCO Demo', direccion: 'Cra 7 # 71-21, Bogotá',
  telefono: '+57 601 555 1234', email: 'contacto@hrco.test',
  ciudad: 'Bogotá', pais: 'Colombia',
  salarioMinimo: '1423500', auxilioTransporte: '200000',
  porcentajeSalud: '0.04', porcentajePension: '0.04',
  recargoExtraDiurna: '0.25', recargoExtraNocturna: '0.75', recargoExtraDominical: '1.00',
  periodicidadNomina: 'MENSUAL', activa: true, createdAt: now, updatedAt: now,
};

const fakeUser: User = {
  id: 'u-1', email: 'admin@hrco.test', nombre: 'Dilan', apellido: 'Test',
  rol: 'ADMIN_EMPRESA', empresaId: 'emp-1',
};

const areas: Area[] = [
  { id: 'a-1', empresaId: 'emp-1', nombre: 'Tecnología', descripcion: 'Desarrollo y operaciones', activa: true, createdAt: now, updatedAt: now },
  { id: 'a-2', empresaId: 'emp-1', nombre: 'Recursos Humanos', descripcion: 'Gestión de personal', activa: true, createdAt: now, updatedAt: now },
  { id: 'a-3', empresaId: 'emp-1', nombre: 'Ventas', descripcion: 'Comercial', activa: true, createdAt: now, updatedAt: now },
  { id: 'a-4', empresaId: 'emp-1', nombre: 'Finanzas', descripcion: 'Contabilidad', activa: true, createdAt: now, updatedAt: now },
];

const cargos: Cargo[] = [
  { id: 'c-1', empresaId: 'emp-1', nombre: 'Desarrollador Senior', salarioBase: '6500000', activo: true, createdAt: now, updatedAt: now },
  { id: 'c-2', empresaId: 'emp-1', nombre: 'Desarrollador Junior', salarioBase: '3500000', activo: true, createdAt: now, updatedAt: now },
  { id: 'c-3', empresaId: 'emp-1', nombre: 'Analista RRHH', salarioBase: '3200000', activo: true, createdAt: now, updatedAt: now },
  { id: 'c-4', empresaId: 'emp-1', nombre: 'Ejecutivo de Ventas', salarioBase: '2800000', activo: true, createdAt: now, updatedAt: now },
  { id: 'c-5', empresaId: 'emp-1', nombre: 'Contador', salarioBase: '4200000', activo: true, createdAt: now, updatedAt: now },
];

const empleados: Empleado[] = [
  { id: 'e-1', empresaId: 'emp-1', documento: '1010123456', tipoDocumento: 'CC', nombre: 'Dilan', apellido: 'Test', email: 'dilan@hrco.test', telefono: '+57 300 1234567', fechaIngreso: '2024-01-15T00:00:00Z', tipoContrato: 'TERMINO_INDEFINIDO', salario: '6500000', areaId: 'a-1', area: areas[0], cargoId: 'c-1', cargo: cargos[0], eps: 'Sura', arl: 'Positiva', pension: 'Porvenir', estado: 'ACTIVO', createdAt: now, updatedAt: now },
  { id: 'e-2', empresaId: 'emp-1', documento: '1020234567', tipoDocumento: 'CC', nombre: 'María', apellido: 'Gómez', email: 'maria@hrco.test', fechaIngreso: '2024-03-01T00:00:00Z', tipoContrato: 'TERMINO_INDEFINIDO', salario: '3500000', areaId: 'a-1', area: areas[0], cargoId: 'c-2', cargo: cargos[1], estado: 'ACTIVO', createdAt: now, updatedAt: now },
  { id: 'e-3', empresaId: 'emp-1', documento: '1030345678', tipoDocumento: 'CC', nombre: 'Carlos', apellido: 'Rodríguez', email: 'carlos@hrco.test', fechaIngreso: '2023-08-20T00:00:00Z', tipoContrato: 'TERMINO_INDEFINIDO', salario: '3200000', areaId: 'a-2', area: areas[1], cargoId: 'c-3', cargo: cargos[2], estado: 'ACTIVO', createdAt: now, updatedAt: now },
  { id: 'e-4', empresaId: 'emp-1', documento: '1040456789', tipoDocumento: 'CC', nombre: 'Laura', apellido: 'Pérez', email: 'laura@hrco.test', fechaIngreso: '2024-06-10T00:00:00Z', tipoContrato: 'TERMINO_FIJO', salario: '2800000', areaId: 'a-3', area: areas[2], cargoId: 'c-4', cargo: cargos[3], estado: 'VACACIONES', createdAt: now, updatedAt: now },
  { id: 'e-5', empresaId: 'emp-1', documento: '1050567890', tipoDocumento: 'CC', nombre: 'Andrés', apellido: 'Mejía', email: 'andres@hrco.test', fechaIngreso: '2022-11-05T00:00:00Z', tipoContrato: 'TERMINO_INDEFINIDO', salario: '4200000', areaId: 'a-4', area: areas[3], cargoId: 'c-5', cargo: cargos[4], estado: 'ACTIVO', createdAt: now, updatedAt: now },
  { id: 'e-6', empresaId: 'emp-1', documento: '1060678901', tipoDocumento: 'CC', nombre: 'Sofía', apellido: 'Hernández', email: 'sofia@hrco.test', fechaIngreso: '2025-02-01T00:00:00Z', tipoContrato: 'TERMINO_FIJO', salario: '3000000', areaId: 'a-3', area: areas[2], cargoId: 'c-4', cargo: cargos[3], estado: 'INCAPACIDAD', createdAt: now, updatedAt: now },
];

const novedades: Novedad[] = [
  { id: 'n-1', empresaId: 'emp-1', empleadoId: 'e-1', empleado: empleados[0], tipo: 'HORAS_EXTRA_DIURNA', fechaInicio: today, cantidad: '8', monto: '0', descripcion: 'Cierre proyecto', estado: 'PENDIENTE', createdAt: now, updatedAt: now },
  { id: 'n-2', empresaId: 'emp-1', empleadoId: 'e-2', empleado: empleados[1], tipo: 'BONIFICACION', fechaInicio: today, cantidad: '0', monto: '500000', descripcion: 'Cumplimiento metas', estado: 'APROBADA', createdAt: now, updatedAt: now },
  { id: 'n-3', empresaId: 'emp-1', empleadoId: 'e-4', empleado: empleados[3], tipo: 'VACACIONES', fechaInicio: today, fechaFin: today, cantidad: '15', monto: '0', estado: 'APLICADA', createdAt: now, updatedAt: now },
  { id: 'n-4', empresaId: 'emp-1', empleadoId: 'e-3', empleado: empleados[2], tipo: 'COMISION', fechaInicio: today, cantidad: '0', monto: '320000', estado: 'PENDIENTE', createdAt: now, updatedAt: now },
];

const periodos: PeriodoNomina[] = [
  {
    id: 'p-1', empresaId: 'emp-1', nombre: 'Mayo 2026',
    fechaInicio: '2026-05-01T00:00:00Z', fechaFin: '2026-05-31T00:00:00Z',
    periodicidad: 'MENSUAL', estado: 'LIQUIDADO',
    totalDevengado: '23250000', totalDeducciones: '1860000', totalNeto: '21390000',
    liquidadoEn: now, createdAt: now, updatedAt: now,
    detalles: empleados.slice(0, 5).map((e, i) => ({
      id: `dn-${i}`, periodoId: 'p-1', empleadoId: e.id, empleado: e,
      salarioBase: e.salario, diasTrabajados: 30,
      auxilioTransporte: Number(e.salario) <= 2847000 ? '200000' : '0',
      horasExtraDiurnas: '0', horasExtraNocturnas: '0', horasExtraDominicales: '0',
      bonificaciones: '0', comisiones: '0',
      totalDevengado: String(Number(e.salario) + (Number(e.salario) <= 2847000 ? 200000 : 0)),
      salud: String(Number(e.salario) * 0.04),
      pension: String(Number(e.salario) * 0.04),
      retencionFuente: '0', otrasDeducciones: '0',
      totalDeducciones: String(Number(e.salario) * 0.08),
      neto: String(Number(e.salario) * 0.92 + (Number(e.salario) <= 2847000 ? 200000 : 0)),
    })),
  },
  {
    id: 'p-2', empresaId: 'emp-1', nombre: 'Abril 2026',
    fechaInicio: '2026-04-01T00:00:00Z', fechaFin: '2026-04-30T00:00:00Z',
    periodicidad: 'MENSUAL', estado: 'LIQUIDADO',
    totalDevengado: '23250000', totalDeducciones: '1860000', totalNeto: '21390000',
    liquidadoEn: now, createdAt: now, updatedAt: now,
  },
];

const usuarios: User[] = [
  fakeUser,
  { id: 'u-2', email: 'rrhh@hrco.test', nombre: 'Carolina', apellido: 'López', rol: 'RRHH', empresaId: 'emp-1' },
  { id: 'u-3', email: 'contador@hrco.test', nombre: 'Andrés', apellido: 'Mejía', rol: 'CONTADOR', empresaId: 'emp-1' },
  { id: 'u-4', email: 'empleado@hrco.test', nombre: 'Dilan', apellido: 'Test', rol: 'EMPLEADO', empresaId: 'emp-1', empleadoId: 'e-1' },
];

const kpis: DashboardKPIs = {
  empleadosActivos: empleados.filter((e) => e.estado === 'ACTIVO').length,
  nominaDelMes: '21390000',
  novedadesPendientes: novedades.filter((n) => n.estado === 'PENDIENTE').length,
  crecimientoEmpleados: 12.5,
  totalEmpleados: empleados.length,
  totalAreas: areas.length,
  totalCargos: cargos.length,
  ultimoPeriodo: periodos[0],
};

function paginate<T>(arr: T[], cfg?: AxiosRequestConfig) {
  const page = Number(cfg?.params?.page ?? 1);
  const pageSize = Number(cfg?.params?.pageSize ?? 20);
  const start = (page - 1) * pageSize;
  return {
    success: true,
    data: arr.slice(start, start + pageSize),
    meta: { page, pageSize, total: arr.length, totalPages: Math.ceil(arr.length / pageSize) || 1 },
  };
}

/**
 * Aplica filtros estándar: q (búsqueda libre), estado, tipo, activo/activa.
 * El parámetro `searchFields` indica las claves de cada item donde se busca `q`.
 */
function filterAndPaginate<T extends Record<string, any>>(
  arr: T[],
  cfg: AxiosRequestConfig | undefined,
  searchFields: (keyof T)[] = [],
) {
  const params = cfg?.params ?? {};
  const q = String(params.q ?? '').trim().toLowerCase();
  const estado = params.estado ? String(params.estado) : '';
  const tipo = params.tipo ? String(params.tipo) : '';
  const activo = params.activo;
  const activa = params.activa;

  let result = arr;

  if (q && searchFields.length) {
    result = result.filter((item) =>
      searchFields.some((field) => {
        const v = item[field];
        return v != null && String(v).toLowerCase().includes(q);
      }),
    );
  }
  if (estado) result = result.filter((item) => item.estado === estado);
  if (tipo) result = result.filter((item) => item.tipo === tipo);
  if (activo !== undefined) result = result.filter((item) => item.activo === activo || String(item.activo) === String(activo));
  if (activa !== undefined) result = result.filter((item) => item.activa === activa || String(item.activa) === String(activa));

  return paginate(result, cfg);
}

function ok(data: any) { return { success: true, data }; }

function match(url: string | undefined, re: RegExp) {
  if (!url) return null;
  const m = url.match(re);
  return m ? m[1] : null;
}

export function installMockApi() {
  // Login en mock: cualquier credencial entra
  api.interceptors.request.use((config) => {
    const url = config.url ?? '';
    const method = (config.method ?? 'get').toLowerCase();

    // Helper para resolver con respuesta fake
    const respond = (status: number, payload: any) => {
      const adapter = async () => ({
        data: payload, status, statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config, request: {},
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config as any).adapter = adapter;
      return config;
    };

    // ── Auth
    if (url === '/auth/login' && method === 'post') {
      return respond(200, ok({
        accessToken: 'fake-token', refreshToken: 'fake-refresh',
        expiresIn: 900, user: fakeUser,
      }));
    }
    if (url === '/auth/register' && method === 'post') {
      return respond(201, ok({
        accessToken: 'fake-token', refreshToken: 'fake-refresh',
        expiresIn: 900, user: fakeUser,
      }));
    }
    if (url === '/auth/me') return respond(200, ok({ user: fakeUser, empresa }));
    if (url === '/auth/logout') return respond(204, '');

    // ── Dashboard
    if (url === '/dashboard') return respond(200, ok(kpis));

    // ── Empresa
    if (url === '/empresa' && method === 'get') return respond(200, ok(empresa));
    if (url === '/empresa' && method === 'patch') return respond(200, ok({ ...empresa, ...(config.data ? JSON.parse(config.data) : {}) }));

    // ── Áreas
    if (url === '/areas' && method === 'get') return respond(200, filterAndPaginate(areas, config, ['nombre', 'descripcion']));
    if (url === '/areas' && method === 'post') return respond(201, ok({ ...JSON.parse(config.data), id: `a-${Date.now()}`, empresaId: 'emp-1', createdAt: now, updatedAt: now }));
    const areaId = match(url, /^\/areas\/(.+)$/);
    if (areaId && method === 'put') return respond(200, ok({ id: areaId, empresaId: 'emp-1', ...JSON.parse(config.data), updatedAt: now }));
    if (areaId && method === 'delete') return respond(204, '');
    if (areaId && method === 'get') return respond(200, ok(areas.find((a) => a.id === areaId)));

    // ── Cargos
    if (url === '/cargos' && method === 'get') return respond(200, filterAndPaginate(cargos, config, ['nombre', 'descripcion']));
    if (url === '/cargos' && method === 'post') return respond(201, ok({ ...JSON.parse(config.data), id: `c-${Date.now()}`, empresaId: 'emp-1', createdAt: now, updatedAt: now }));
    const cargoId = match(url, /^\/cargos\/(.+)$/);
    if (cargoId && method === 'put') return respond(200, ok({ id: cargoId, empresaId: 'emp-1', ...JSON.parse(config.data), updatedAt: now }));
    if (cargoId && method === 'delete') return respond(204, '');

    // ── Empleados
    if (url === '/empleados' && method === 'get') {
      return respond(200, filterAndPaginate(empleados, config, ['documento', 'nombre', 'apellido', 'email']));
    }
    if (url === '/empleados' && method === 'post') return respond(201, ok({ ...JSON.parse(config.data), id: `e-${Date.now()}`, empresaId: 'emp-1', estado: 'ACTIVO', createdAt: now, updatedAt: now }));
    const empId = match(url, /^\/empleados\/(.+)$/);
    if (empId && method === 'put') return respond(200, ok({ id: empId, empresaId: 'emp-1', ...JSON.parse(config.data), updatedAt: now }));
    if (empId && method === 'delete') return respond(204, '');
    if (empId && method === 'get') return respond(200, ok(empleados.find((e) => e.id === empId)));

    // ── Novedades
    if (url === '/novedades' && method === 'get') return respond(200, filterAndPaginate(novedades, config, ['descripcion']));
    if (url === '/novedades' && method === 'post') return respond(201, ok({ ...JSON.parse(config.data), id: `n-${Date.now()}`, empresaId: 'emp-1', estado: 'PENDIENTE', createdAt: now, updatedAt: now }));
    const novId = match(url, /^\/novedades\/([^/]+)$/);
    if (novId && method === 'put') return respond(200, ok({ id: novId, empresaId: 'emp-1', ...JSON.parse(config.data), updatedAt: now }));
    if (novId && method === 'delete') return respond(204, '');
    const aprobarId = match(url, /^\/novedades\/(.+)\/aprobar$/);
    if (aprobarId && method === 'post') {
      const n = novedades.find((x) => x.id === aprobarId);
      return respond(200, ok({ ...(n ?? {}), estado: 'APROBADA' }));
    }
    const rechazarId = match(url, /^\/novedades\/(.+)\/rechazar$/);
    if (rechazarId && method === 'post') {
      const n = novedades.find((x) => x.id === rechazarId);
      return respond(200, ok({ ...(n ?? {}), estado: 'RECHAZADA' }));
    }

    // ── Nómina
    if (url === '/nomina/periodos' && method === 'get') return respond(200, paginate(periodos, config));
    if (url === '/nomina/periodos' && method === 'post') {
      const body = JSON.parse(config.data);
      return respond(201, ok({
        id: `p-${Date.now()}`, empresaId: 'emp-1',
        nombre: body.nombre, fechaInicio: body.fechaInicio, fechaFin: body.fechaFin,
        periodicidad: body.periodicidad ?? 'MENSUAL', estado: 'ABIERTO',
        totalDevengado: '0', totalDeducciones: '0', totalNeto: '0',
        detalles: periodos[0].detalles, createdAt: now, updatedAt: now,
      }));
    }
    const periodoId = match(url, /^\/nomina\/periodos\/([^/]+)$/);
    if (periodoId && method === 'get') return respond(200, ok(periodos.find((p) => p.id === periodoId)));
    const recalcId = match(url, /^\/nomina\/periodos\/(.+)\/recalcular$/);
    if (recalcId) return respond(200, ok(periodos.find((p) => p.id === recalcId)));
    const liquidarId = match(url, /^\/nomina\/periodos\/(.+)\/liquidar$/);
    if (liquidarId) {
      const p = periodos.find((x) => x.id === liquidarId);
      return respond(200, ok({ ...(p ?? {}), estado: 'LIQUIDADO', liquidadoEn: now }));
    }

    // ── Usuarios
    if (url === '/usuarios' && method === 'get') return respond(200, filterAndPaginate(usuarios, config, ['email', 'nombre', 'apellido']));
    if (url === '/usuarios' && method === 'post') return respond(201, ok({ ...JSON.parse(config.data), id: `u-${Date.now()}`, empresaId: 'emp-1' }));
    const userId = match(url, /^\/usuarios\/(.+)$/);
    if (userId && method === 'put') return respond(200, ok({ id: userId, empresaId: 'emp-1', ...JSON.parse(config.data) }));
    if (userId && method === 'delete') return respond(204, '');

    // ── Reportes
    if (url?.startsWith('/reportes/')) {
      const csv = 'Documento,Nombre,Apellido,Estado\n' +
        empleados.map((e) => `${e.documento},${e.nombre},${e.apellido},${e.estado}`).join('\n');
      return respond(200, new Blob([csv], { type: 'text/csv' }));
    }

    return config;
  });

  // Pre-loguea el usuario falso para saltar el login
  const store = useAuthStore.getState();
  if (!store.accessToken) {
    store.setAuth({
      accessToken: 'fake-token', refreshToken: 'fake-refresh',
      expiresIn: 900, user: fakeUser,
    });
  }

  // eslint-disable-next-line no-console
  console.log('🟣 [HRCO] Modo DEV sin backend activado — datos en memoria');
}
