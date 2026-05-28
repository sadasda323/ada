import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { empleadosApi, novedadesApi } from '@/services/api.service';
import { extractErrorMessage } from '@/lib/api';
import { formatCOP, formatDate } from '@/lib/utils';
import type { EstadoNovedad, Novedad } from '@/types';

const schema = z.object({
  empleadoId: z.string().min(1, 'Requerido'),
  tipo: z.string().min(1, 'Requerido'),
  fechaInicio: z.string().min(1, 'Requerido'),
  fechaFin: z.string().optional(),
  cantidad: z.string().optional(),
  monto: z.string().optional(),
  descripcion: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

const estadoTone: Record<EstadoNovedad, 'success' | 'default' | 'warning' | 'danger' | 'info'> = {
  PENDIENTE: 'warning',
  APROBADA: 'info',
  RECHAZADA: 'danger',
  APLICADA: 'success',
};

const tipoLabel: Record<string, string> = {
  INCAPACIDAD: 'Incapacidad',
  VACACIONES: 'Vacaciones',
  HORAS_EXTRA_DIURNA: 'H.E. diurna',
  HORAS_EXTRA_NOCTURNA: 'H.E. nocturna',
  HORAS_EXTRA_DOMINICAL: 'H.E. dominical',
  BONIFICACION: 'Bonificación',
  COMISION: 'Comisión',
  DEDUCCION: 'Deducción',
  PRESTAMO: 'Préstamo',
  LICENCIA: 'Licencia',
  AUSENCIA: 'Ausencia',
};

export function NovedadesPage() {
  const qc = useQueryClient();
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [editing, setEditing] = useState<Novedad | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['novedades', { estadoFilter, tipoFilter }],
    queryFn: () => novedadesApi.list({ estado: estadoFilter || undefined, tipo: tipoFilter || undefined, pageSize: 50 }),
  });
  const empleadosQ = useQuery({ queryKey: ['empleados-all'], queryFn: () => empleadosApi.list({ pageSize: 200, estado: 'ACTIVO' }) });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onOpen = (n?: Novedad) => {
    setEditing(n ?? null);
    reset({
      empleadoId: n?.empleadoId ?? '',
      tipo: n?.tipo ?? 'BONIFICACION',
      fechaInicio: n?.fechaInicio ? n.fechaInicio.slice(0, 10) : '',
      fechaFin: n?.fechaFin ? n.fechaFin.slice(0, 10) : '',
      cantidad: n?.cantidad ?? '0',
      monto: n?.monto ?? '0',
      descripcion: n?.descripcion ?? '',
    });
    setModalOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: (v: FormValues) => {
      const body = {
        ...v,
        fechaInicio: new Date(v.fechaInicio).toISOString(),
        fechaFin: v.fechaFin ? new Date(v.fechaFin).toISOString() : undefined,
        cantidad: v.cantidad || '0',
        monto: v.monto || '0',
      };
      return editing ? novedadesApi.update(editing.id, body) : novedadesApi.create(body);
    },
    onSuccess: () => {
      toast.success(editing ? 'Novedad actualizada' : 'Novedad creada');
      qc.invalidateQueries({ queryKey: ['novedades'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => novedadesApi.remove(id),
    onSuccess: () => {
      toast.success('Eliminada');
      qc.invalidateQueries({ queryKey: ['novedades'] });
      setConfirmId(null);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const aprobarMut = useMutation({
    mutationFn: (id: string) => novedadesApi.aprobar(id),
    onSuccess: () => { toast.success('Aprobada'); qc.invalidateQueries({ queryKey: ['novedades'] }); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
  const rechazarMut = useMutation({
    mutationFn: (id: string) => novedadesApi.rechazar(id),
    onSuccess: () => { toast.success('Rechazada'); qc.invalidateQueries({ queryKey: ['novedades'] }); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novedades</h1>
          <p className="text-sm text-slate-500">Horas extra, bonificaciones, vacaciones, deducciones</p>
        </div>
        <Button onClick={() => onOpen()}>
          <Plus className="h-4 w-4" /> Nueva novedad
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          name="estadoFilter"
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          placeholder="Todos los estados"
          options={[
            { value: 'PENDIENTE', label: 'Pendientes' },
            { value: 'APROBADA', label: 'Aprobadas' },
            { value: 'RECHAZADA', label: 'Rechazadas' },
            { value: 'APLICADA', label: 'Aplicadas' },
          ]}
          className="max-w-xs"
        />
        <Select
          name="tipoFilter"
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          placeholder="Todos los tipos"
          options={Object.entries(tipoLabel).map(([v, l]) => ({ value: v, label: l }))}
          className="max-w-xs"
        />
      </div>

      <Table
        columns={[
          {
            key: 'empleado', header: 'Empleado',
            render: (n: Novedad) => n.empleado ? `${n.empleado.nombre} ${n.empleado.apellido}` : '—',
          },
          { key: 'tipo', header: 'Tipo', render: (n) => <Badge tone="brand">{tipoLabel[n.tipo] || n.tipo}</Badge> },
          { key: 'fechaInicio', header: 'Inicio', render: (n) => formatDate(n.fechaInicio) },
          { key: 'fechaFin', header: 'Fin', render: (n) => formatDate(n.fechaFin) },
          { key: 'cantidad', header: 'Cantidad', render: (n) => n.cantidad },
          { key: 'monto', header: 'Monto', render: (n) => <span className="tabular-nums">{formatCOP(n.monto)}</span> },
          { key: 'estado', header: 'Estado', render: (n) => <Badge tone={estadoTone[n.estado]}>{n.estado}</Badge> },
          {
            key: '_actions', header: '', className: 'w-40 text-right',
            render: (n) => (
              <div className="flex justify-end gap-1">
                {n.estado === 'PENDIENTE' && (
                  <>
                    <button onClick={() => aprobarMut.mutate(n.id)} className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600" title="Aprobar"><Check className="h-4 w-4" /></button>
                    <button onClick={() => rechazarMut.mutate(n.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600" title="Rechazar"><X className="h-4 w-4" /></button>
                  </>
                )}
                <button onClick={() => onOpen(n)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setConfirmId(n.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ),
          },
        ]}
        rows={data?.items ?? []}
        rowKey={(n) => n.id}
        loading={isLoading}
        emptyText="No hay novedades."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar novedad' : 'Nueva novedad'} size="md">
        <form onSubmit={handleSubmit((v) => saveMut.mutate(v))} className="space-y-4">
          <Select
            label="Empleado *"
            placeholder="Selecciona empleado"
            options={(empleadosQ.data?.items ?? []).map((e) => ({ value: e.id, label: `${e.nombre} ${e.apellido} (${e.documento})` }))}
            error={errors.empleadoId?.message}
            {...register('empleadoId')}
          />
          <Select
            label="Tipo *"
            options={Object.entries(tipoLabel).map(([v, l]) => ({ value: v, label: l }))}
            error={errors.tipo?.message}
            {...register('tipo')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha inicio *" type="date" error={errors.fechaInicio?.message} {...register('fechaInicio')} />
            <Input label="Fecha fin" type="date" {...register('fechaFin')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cantidad" type="number" step="0.01" hint="Horas o días" {...register('cantidad')} />
            <Input label="Monto (COP)" type="number" step="0.01" {...register('monto')} />
          </div>
          <Input label="Descripción" {...register('descripcion')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saveMut.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar novedad"
        message="Esta acción no se puede deshacer."
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteMut.mutate(confirmId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
