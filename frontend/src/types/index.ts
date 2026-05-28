// Tipos compartidos con el backend HRCO

export type Rol = 'ADMIN_EMPRESA' | 'RRHH' | 'CONTADOR' | 'EMPLEADO';

export type EstadoEmpleado =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'VACACIONES'
  | 'INCAPACIDAD'
  | 'RETIRADO';

export type TipoContrato =
  | 'TERMINO_FIJO'
  | 'TERMINO_INDEFINIDO'
  | 'OBRA_O_LABOR'
  | 'PRESTACION_SERVICIOS'
  | 'APRENDIZAJE';

export type TipoNovedad =
  | 'INCAPACIDAD'
  | 'VACACIONES'
  | 'HORAS_EXTRA_DIURNA'
  | 'HORAS_EXTRA_NOCTURNA'
  | 'HORAS_EXTRA_DOMINICAL'
  | 'BONIFICACION'
  | 'COMISION'
  | 'DEDUCCION'
  | 'PRESTAMO'
  | 'LICENCIA'
  | 'AUSENCIA';

export type EstadoNovedad = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'APLICADA';

export type EstadoPeriodo = 'ABIERTO' | 'EN_LIQUIDACION' | 'LIQUIDADO' | 'CERRADO';

export type Periodicidad = 'QUINCENAL' | 'MENSUAL';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  empresaId: string;
  empleadoId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface Empresa {
  id: string;
  nit: string;
  razonSocial: string;
  nombreComercial?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  pais: string;
  logoUrl?: string;
  salarioMinimo: string;
  auxilioTransporte: string;
  porcentajeSalud: string;
  porcentajePension: string;
  recargoExtraDiurna: string;
  recargoExtraNocturna: string;
  recargoExtraDominical: string;
  periodicidadNomina: Periodicidad;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Area {
  id: string;
  empresaId: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cargo {
  id: string;
  empresaId: string;
  nombre: string;
  descripcion?: string;
  salarioBase: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Empleado {
  id: string;
  empresaId: string;
  areaId?: string;
  area?: Area;
  cargoId?: string;
  cargo?: Cargo;
  documento: string;
  tipoDocumento: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaIngreso: string;
  fechaRetiro?: string;
  tipoContrato: TipoContrato;
  salario: string;
  cuentaBancaria?: string;
  banco?: string;
  eps?: string;
  arl?: string;
  pension?: string;
  cesantias?: string;
  estado: EstadoEmpleado;
  createdAt: string;
  updatedAt: string;
}

export interface Novedad {
  id: string;
  empresaId: string;
  empleadoId: string;
  empleado?: Empleado;
  tipo: TipoNovedad;
  fechaInicio: string;
  fechaFin?: string;
  cantidad: string;
  monto: string;
  descripcion?: string;
  estado: EstadoNovedad;
  aplicadaEn?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DetalleNomina {
  id: string;
  periodoId: string;
  empleadoId: string;
  empleado?: Empleado;
  salarioBase: string;
  diasTrabajados: number;
  auxilioTransporte: string;
  horasExtraDiurnas: string;
  horasExtraNocturnas: string;
  horasExtraDominicales: string;
  bonificaciones: string;
  comisiones: string;
  totalDevengado: string;
  salud: string;
  pension: string;
  retencionFuente: string;
  otrasDeducciones: string;
  totalDeducciones: string;
  neto: string;
  observaciones?: string;
}

export interface PeriodoNomina {
  id: string;
  empresaId: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  periodicidad: Periodicidad;
  estado: EstadoPeriodo;
  totalDevengado: string;
  totalDeducciones: string;
  totalNeto: string;
  liquidadoEn?: string;
  detalles?: DetalleNomina[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardKPIs {
  empleadosActivos: number;
  nominaDelMes: string;
  novedadesPendientes: number;
  crecimientoEmpleados: number;
  totalEmpleados: number;
  totalAreas: number;
  totalCargos: number;
  ultimoPeriodo?: PeriodoNomina;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}
