import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { areasApi, cargosApi, empleadosApi } from '@/services/api.service';
import { extractErrorMessage } from '@/lib/api';
import { formatCOP, formatDate } from '@/lib/utils';
import type { Empleado, EstadoEmpleado } from '@/types';

const schema = z.object({
  documento: z.string().min(4, 'Mínimo 4').max(30),
  tipoDocumento: z.string().optional(),
  nombre: z.string().min(1, 'Requerido').max(100),
  apellido: z.string().min(1, 'Requerido').max(100),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().max(30).optional(),
  direccion: z.string().max(300).optional(),
  fechaIngreso: z.string().min(1, 'Requerido'),
  fechaNacimiento: z.string().optional(),
  tipoContrato: z.string().optional(),
  salario: z.string().min(1, 'Requerido').refine((v) => !Number.isNaN(Number(v)), 'Número'),
  areaId: z.string().optional(),
  cargoId: z.string().optional(),
  banco: z.string().optional(),
  cuentaBancaria: z.string().optional(),
  eps: z.string().optional(),
  arl: z.string().optional(),
  pension: z.string().optional(),
  cesantias: z.string().optional(),
  estado: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const estadoTone: Record<EstadoEmpleado, 'success' | 'default' | 'warning' | 'danger' | 'info'> = {
  ACTIVO: 'success',
  INACTIVO: 'default',
  VACACIONES: 'info',
  INCAPACIDAD: 'warning',
  RETIRADO: 'danger',
};

export function EmpleadosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Empleado | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['empleados', { search, estadoFilter, page }],
    queryFn: () => empleadosApi.list({ q: search, estado: estadoFilter || undefined, page, pageSize: 20 }),
  });

  const areasQ = useQuery({ queryKey: ['areas-all'], queryFn: () => areasApi.list({ pageSize: 200 }) });
  const cargosQ = useQuery({ queryKey: ['cargos-all'], queryFn: () => cargosApi.list({ pageSize: 200 }) });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onOpen = (e?: Empleado) => {
    setEditing(e ?? null);
    reset({
      documento: e?.documento ?? '',
      tipoDocumento: e?.tipoDocumento ?? 'CC',
      nombre: e?.nombre ?? '',
      apellido: e?.apellido ?? '',
      email: e?.email ?? '',
      telefono: e?.telefono ?? '',
      direccion: e?.direccion ?? '',
      fechaIngreso: e?.fechaIngreso ? e.fechaIngreso.slice(0, 10) : '',
      fechaNacimiento: e?.fechaNacimiento ? e.fechaNacimiento.slice(0, 10) : '',
      tipoContrato: e?.tipoContrato ?? 'TERMINO_INDEFINIDO',
      salario: e?.salario ?? '',
      areaId: e?.areaId ?? '',
      cargoId: e?.cargoId ?? '',
      banco: e?.banco ?? '',
      cuentaBancaria: e?.cuentaBancaria ?? '',
      eps: e?.eps ?? '',
      arl: e?.arl ?? '',
      pension: e?.pension ?? '',
      cesantias: e?.cesantias ?? '',
      estado: e?.estado ?? 'ACTIVO',
    });
    setModalOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: (v: FormValues) => {
      const body = {
        ...v,
        email: v.email || undefined,
        areaId: v.areaId || undefined,
        cargoId: v.cargoId || undefined,
        fechaIngreso: new Date(v.fechaIngreso).toISOString(),
        fechaNacimiento: v.fechaNacimiento ? new Date(v.fechaNacimiento).toISOString() : undefined,
      };
      return editing ? empleadosApi.update(editing.id, body) : empleadosApi.create(body);
    },
    onSuccess: () => {
      toast.success(editing ? 'Empleado actualizado' : 'Empleado creado');
      qc.invalidateQueries({ queryKey: ['empleados'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => empleadosApi.remove(id),
    onSuccess: () => {
      toast.success('Empleado eliminado');
      qc.invalidateQueries({ queryKey: ['empleados'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setConfirmId(null);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empleados</h1>
          <p className="text-sm text-slate-500">Gestiona el personal de tu empresa</p>
        </div>
        <Button onClick={() => onOpen()}>
          <Plus className="h-4 w-4" /> Nuevo empleado
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-9" placeholder="Buscar por nombre, documento o email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select
          name="estadoFilter"
          value={estadoFilter}
          onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
          placeholder="Todos los estados"
          options={[
            { value: 'ACTIVO', label: 'Activo' },
            { value: 'INACTIVO', label: 'Inactivo' },
            { value: 'VACACIONES', label: 'Vacaciones' },
            { value: 'INCAPACIDAD', label: 'Incapacidad' },
            { value: 'RETIRADO', label: 'Retirado' },
          ]}
          className="max-w-xs"
        />
      </div>

      <Table
        columns={[
          {
            key: 'nombre', header: 'Empleado',
            render: (e) => (
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">{e.nombre} {e.apellido}</span>
                <span className="text-xs text-slate-500">{e.documento} · {e.email || 'Sin email'}</span>
              </div>
            ),
          },
          { key: 'cargo', header: 'Cargo', render: (e) => e.cargo?.nombre || '—' },
          { key: 'area', header: 'Área', render: (e) => e.area?.nombre || '—' },
          { key: 'salario', header: 'Salario', render: (e) => <span className="tabular-nums">{formatCOP(e.salario)}</span> },
          { key: 'fechaIngreso', header: 'Ingreso', render: (e) => formatDate(e.fechaIngreso) },
          { key: 'estado', header: 'Estado', render: (e) => <Badge tone={estadoTone[e.estado]}>{e.estado}</Badge> },
          {
            key: '_actions', header: '', className: 'w-24 text-right',
            render: (e) => (
              <div className="flex justify-end gap-1">
                <button onClick={() => onOpen(e)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setConfirmId(e.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ),
          },
        ]}
        rows={data?.items ?? []}
        rowKey={(e) => e.id}
        loading={isLoading}
        emptyText="No hay empleados. Crea el primero."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar empleado' : 'Nuevo empleado'} size="xl">
        <form onSubmit={handleSubmit((v) => saveMut.mutate(v))} className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Datos personales</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select label="Tipo doc." options={[
                { value: 'CC', label: 'Cédula (CC)' },
                { value: 'CE', label: 'Cédula extranjería (CE)' },
                { value: 'PA', label: 'Pasaporte (PA)' },
                { value: 'TI', label: 'Tarjeta identidad (TI)' },
              ]} {...register('tipoDocumento')} />
              <Input label="Documento *" error={errors.documento?.message} {...register('documento')} />
              <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
              <Input label="Nombre *" error={errors.nombre?.message} {...register('nombre')} />
              <Input label="Apellido *" error={errors.apellido?.message} {...register('apellido')} />
              <Input label="Teléfono" {...register('telefono')} />
              <Input label="Fecha nacimiento" type="date" {...register('fechaNacimiento')} />
              <Input label="Dirección" {...register('direccion')} className="sm:col-span-2" />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Contrato y salario</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Fecha ingreso *" type="date" error={errors.fechaIngreso?.message} {...register('fechaIngreso')} />
              <Select label="Tipo contrato" options={[
                { value: 'TERMINO_INDEFINIDO', label: 'Término indefinido' },
                { value: 'TERMINO_FIJO', label: 'Término fijo' },
                { value: 'OBRA_O_LABOR', label: 'Obra o labor' },
                { value: 'PRESTACION_SERVICIOS', label: 'Prestación de servicios' },
                { value: 'APRENDIZAJE', label: 'Aprendizaje' },
              ]} {...register('tipoContrato')} />
              <Input
                label="Salario (COP) *"
                type="number"
                min="0"
                step="0.01"
                error={errors.salario?.message}
                {...register('salario')}
              />
              <Select
                label="Área"
                placeholder="Sin asignar"
                options={(areasQ.data?.items ?? []).map((a) => ({ value: a.id, label: a.nombre }))}
                {...register('areaId')}
              />
              <Select
                label="Cargo"
                placeholder="Sin asignar"
                options={(cargosQ.data?.items ?? []).map((c) => ({ value: c.id, label: c.nombre }))}
                {...register('cargoId')}
              />
              <Select label="Estado" options={[
                { value: 'ACTIVO', label: 'Activo' },
                { value: 'INACTIVO', label: 'Inactivo' },
                { value: 'VACACIONES', label: 'Vacaciones' },
                { value: 'INCAPACIDAD', label: 'Incapacidad' },
                { value: 'RETIRADO', label: 'Retirado' },
              ]} {...register('estado')} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Bancarios y afiliaciones</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Banco" {...register('banco')} />
              <Input label="Cuenta bancaria" {...register('cuentaBancaria')} />
              <Input label="EPS" {...register('eps')} />
              <Input label="ARL" {...register('arl')} />
              <Input label="Fondo pensión" {...register('pension')} />
              <Input label="Cesantías" {...register('cesantias')} />
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saveMut.isPending}>Guardar empleado</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar empleado"
        message="¿Seguro? Esta acción no se puede deshacer."
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteMut.mutate(confirmId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
