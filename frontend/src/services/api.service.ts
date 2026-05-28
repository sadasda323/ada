import { api } from '@/lib/api';
import type { ApiResponse, Area, Cargo, DashboardKPIs, Empleado, Empresa, Novedad, PaginatedResult, PeriodoNomina, User } from '@/types';

interface ListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  [key: string]: any;
}

async function list<T>(url: string, params?: ListParams): Promise<PaginatedResult<T>> {
  const r = await api.get<ApiResponse<T[]>>(url, { params });
  return { items: r.data.data, meta: r.data.meta! };
}
async function getOne<T>(url: string): Promise<T> {
  const r = await api.get<ApiResponse<T>>(url);
  return r.data.data;
}
async function postJSON<T>(url: string, body: any): Promise<T> {
  const r = await api.post<ApiResponse<T>>(url, body);
  return r.data.data;
}
async function putJSON<T>(url: string, body: any): Promise<T> {
  const r = await api.put<ApiResponse<T>>(url, body);
  return r.data.data;
}
async function patchJSON<T>(url: string, body: any): Promise<T> {
  const r = await api.patch<ApiResponse<T>>(url, body);
  return r.data.data;
}
async function del(url: string): Promise<void> {
  await api.delete(url);
}

// ─── Áreas ───────────────────────────────────────────────────────────────────
export const areasApi = {
  list: (p?: ListParams) => list<Area>('/areas', p),
  get: (id: string) => getOne<Area>(`/areas/${id}`),
  create: (b: { nombre: string; descripcion?: string; activa?: boolean }) => postJSON<Area>('/areas', b),
  update: (id: string, b: { nombre: string; descripcion?: string; activa?: boolean }) => putJSON<Area>(`/areas/${id}`, b),
  remove: (id: string) => del(`/areas/${id}`),
};

// ─── Cargos ──────────────────────────────────────────────────────────────────
export const cargosApi = {
  list: (p?: ListParams) => list<Cargo>('/cargos', p),
  get: (id: string) => getOne<Cargo>(`/cargos/${id}`),
  create: (b: { nombre: string; descripcion?: string; salarioBase: string; activo?: boolean }) =>
    postJSON<Cargo>('/cargos', b),
  update: (id: string, b: { nombre: string; descripcion?: string; salarioBase: string; activo?: boolean }) =>
    putJSON<Cargo>(`/cargos/${id}`, b),
  remove: (id: string) => del(`/cargos/${id}`),
};

// ─── Empleados ───────────────────────────────────────────────────────────────
export interface EmpleadoInput {
  documento: string;
  tipoDocumento?: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaIngreso: string;
  fechaRetiro?: string;
  tipoContrato?: string;
  salario: string;
  areaId?: string;
  cargoId?: string;
  banco?: string;
  cuentaBancaria?: string;
  eps?: string;
  arl?: string;
  pension?: string;
  cesantias?: string;
  estado?: string;
}
export const empleadosApi = {
  list: (p?: ListParams) => list<Empleado>('/empleados', p),
  get: (id: string) => getOne<Empleado>(`/empleados/${id}`),
  create: (b: EmpleadoInput) => postJSON<Empleado>('/empleados', b),
  update: (id: string, b: EmpleadoInput) => putJSON<Empleado>(`/empleados/${id}`, b),
  remove: (id: string) => del(`/empleados/${id}`),
};

// ─── Novedades ───────────────────────────────────────────────────────────────
export interface NovedadInput {
  empleadoId: string;
  tipo: string;
  fechaInicio: string;
  fechaFin?: string;
  cantidad?: string;
  monto?: string;
  descripcion?: string;
}
export const novedadesApi = {
  list: (p?: ListParams) => list<Novedad>('/novedades', p),
  create: (b: NovedadInput) => postJSON<Novedad>('/novedades', b),
  update: (id: string, b: NovedadInput) => putJSON<Novedad>(`/novedades/${id}`, b),
  remove: (id: string) => del(`/novedades/${id}`),
  aprobar: (id: string) => postJSON<Novedad>(`/novedades/${id}/aprobar`, {}),
  rechazar: (id: string) => postJSON<Novedad>(`/novedades/${id}/rechazar`, {}),
};

// ─── Nómina ──────────────────────────────────────────────────────────────────
export const nominaApi = {
  listar: (p?: ListParams) => list<PeriodoNomina>('/nomina/periodos', p),
  detalle: (id: string) => getOne<PeriodoNomina>(`/nomina/periodos/${id}`),
  generar: (b: { nombre: string; fechaInicio: string; fechaFin: string; periodicidad?: string }) =>
    postJSON<PeriodoNomina>('/nomina/periodos', b),
  recalcular: (id: string) => postJSON<PeriodoNomina>(`/nomina/periodos/${id}/recalcular`, {}),
  liquidar: (id: string) => postJSON<PeriodoNomina>(`/nomina/periodos/${id}/liquidar`, {}),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  kpis: () => getOne<DashboardKPIs>('/dashboard'),
};

// ─── Empresa ─────────────────────────────────────────────────────────────────
export const empresaApi = {
  get: () => getOne<Empresa>('/empresa'),
  update: (b: Partial<Empresa>) => patchJSON<Empresa>('/empresa', b),
};

// ─── Usuarios ────────────────────────────────────────────────────────────────
export interface UsuarioCreateInput {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: string;
  empleadoId?: string;
}
export interface UsuarioUpdateInput {
  nombre: string;
  apellido: string;
  rol: string;
  activo?: boolean;
  empleadoId?: string;
  password?: string;
}
export const usuariosApi = {
  list: (p?: ListParams) => list<User>('/usuarios', p),
  create: (b: UsuarioCreateInput) => postJSON<User>('/usuarios', b),
  update: (id: string, b: UsuarioUpdateInput) => putJSON<User>(`/usuarios/${id}`, b),
  remove: (id: string) => del(`/usuarios/${id}`),
};

// ─── Reportes (CSV) ──────────────────────────────────────────────────────────
export const reportesApi = {
  empleadosCSV: async (params?: { estado?: string }) => {
    const r = await api.get('/reportes/empleados.csv', { params, responseType: 'blob' });
    return r.data as Blob;
  },
  nominaCSV: async (periodoId: string) => {
    const r = await api.get('/reportes/nomina.csv', { params: { periodoId }, responseType: 'blob' });
    return r.data as Blob;
  },
};
