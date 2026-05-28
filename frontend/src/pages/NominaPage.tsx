import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Calculator, Download, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { nominaApi, reportesApi } from '@/services/api.service';
import { extractErrorMessage } from '@/lib/api';
import { formatCOP, formatDate } from '@/lib/utils';
import type { EstadoPeriodo, PeriodoNomina } from '@/types';

const schema = z.object({
  nombre: z.string().min(1, 'Requerido').max(100),
  fechaInicio: z.string().min(1, 'Requerido'),
  fechaFin: z.string().min(1, 'Requerido'),
  periodicidad: z.enum(['MENSUAL', 'QUINCENAL']).optional(),
});
type FormValues = z.infer<typeof schema>;

const estadoTone: Record<EstadoPeriodo, 'success' | 'default' | 'warning' | 'info'> = {
  ABIERTO: 'info',
  EN_LIQUIDACION: 'warning',
  LIQUIDADO: 'success',
  CERRADO: 'default',
};

export function NominaPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: list, isLoading } = useQuery({
    queryKey: ['nomina-periodos'],
    queryFn: () => nominaApi.listar({ pageSize: 50 }),
  });

  const { data: detalle } = useQuery({
    queryKey: ['nomina-periodo', selectedId],
    queryFn: () => nominaApi.detalle(selectedId!),
    enabled: !!selectedId,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', fechaInicio: '', fechaFin: '', periodicidad: 'MENSUAL' },
  });

  const generarMut = useMutation({
    mutationFn: (v: FormValues) => nominaApi.generar({
      ...v,
      fechaInicio: new Date(v.fechaInicio).toISOString(),
      fechaFin: new Date(v.fechaFin).toISOString(),
    }),
    onSuccess: () => {
      toast.success('Período generado');
      qc.invalidateQueries({ queryKey: ['nomina-periodos'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setModalOpen(false);
      reset();
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const recalcMut = useMutation({
    mutationFn: (id: string) => nominaApi.recalcular(id),
    onSuccess: () => {
      toast.success('Recalculado con novedades aprobadas');
      qc.invalidateQueries({ queryKey: ['nomina-periodos'] });
      qc.invalidateQueries({ queryKey: ['nomina-periodo'] });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const liquidarMut = useMutation({
    mutationFn: (id: string) => nominaApi.liquidar(id),
    onSuccess: () => {
      toast.success('Período liquidado');
      qc.invalidateQueries({ queryKey: ['nomina-periodos'] });
      qc.invalidateQueries({ queryKey: ['nomina-periodo'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const downloadCSV = async (id: string, nombre: string) => {
    try {
      const blob = await reportesApi.nominaCSV(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomina_${nombre.replace(/\s+/g, '_')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const periodos = list?.items ?? [];
  const selected = detalle ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nómina</h1>
          <p className="text-sm text-slate-500">Genera, recalcula y liquida períodos</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Nuevo período
        </Button>
      </div>

      <Card className="p-0">
        <Table<PeriodoNomina>
          columns={[
            { key: 'nombre', header: 'Período', render: (p) => <span className="font-medium text-slate-900">{p.nombre}</span> },
            { key: 'fechaInicio', header: 'Inicio', render: (p) => formatDate(p.fechaInicio) },
            { key: 'fechaFin', header: 'Fin', render: (p) => formatDate(p.fechaFin) },
            { key: 'totalDevengado', header: 'Devengado', render: (p) => <span className="tabular-nums">{formatCOP(p.totalDevengado)}</span> },
            { key: 'totalDeducciones', header: 'Deducciones', render: (p) => <span className="tabular-nums">{formatCOP(p.totalDeducciones)}</span> },
            { key: 'totalNeto', header: 'Neto', render: (p) => <span className="tabular-nums font-semibold text-slate-900">{formatCOP(p.totalNeto)}</span> },
            { key: 'estado', header: 'Estado', render: (p) => <Badge tone={estadoTone[p.estado]}>{p.estado}</Badge> },
          ]}
          rows={periodos}
          rowKey={(p) => p.id}
          onRowClick={(p) => setSelectedId(p.id)}
          loading={isLoading}
          emptyText="No hay períodos. Genera el primero."
        />
      </Card>

      {selected && (
        <Card>
          <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{selected.nombre}</h2>
              <p className="text-xs text-slate-500">
                {formatDate(selected.fechaInicio)} – {formatDate(selected.fechaFin)} · {selected.detalles?.length ?? 0} empleados
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => downloadCSV(selected.id, selected.nombre)}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              {selected.estado === 'ABIERTO' && (
                <>
                  <Button variant="outline" onClick={() => recalcMut.mutate(selected.id)} loading={recalcMut.isPending}>
                    <RefreshCw className="h-4 w-4" /> Recalcular
                  </Button>
                  <Button onClick={() => liquidarMut.mutate(selected.id)} loading={liquidarMut.isPending}>
                    <Lock className="h-4 w-4" /> Liquidar
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="p-0">
            <Table
              columns={[
                {
                  key: 'empleado', header: 'Empleado',
                  render: (d: any) => (
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">
                        {d.empleado?.nombre} {d.empleado?.apellido}
                      </span>
                      <span className="text-xs text-slate-500">{d.empleado?.documento}</span>
                    </div>
                  ),
                },
                { key: 'salarioBase', header: 'Salario', render: (d: any) => <span className="tabular-nums">{formatCOP(d.salarioBase)}</span> },
                { key: 'auxilioTransporte', header: 'Aux. Trans.', render: (d: any) => <span className="tabular-nums">{formatCOP(d.auxilioTransporte)}</span> },
                { key: 'totalDevengado', header: 'Devengado', render: (d: any) => <span className="tabular-nums">{formatCOP(d.totalDevengado)}</span> },
                { key: 'salud', header: 'Salud', render: (d: any) => <span className="tabular-nums text-red-600">-{formatCOP(d.salud)}</span> },
                { key: 'pension', header: 'Pensión', render: (d: any) => <span className="tabular-nums text-red-600">-{formatCOP(d.pension)}</span> },
                { key: 'totalDeducciones', header: 'Deducciones', render: (d: any) => <span className="tabular-nums text-red-600">-{formatCOP(d.totalDeducciones)}</span> },
                { key: 'neto', header: 'Neto', render: (d: any) => <span className="tabular-nums font-bold text-slate-900">{formatCOP(d.neto)}</span> },
              ]}
              rows={selected.detalles ?? []}
              rowKey={(d: any) => d.id}
              emptyText="Sin detalles"
            />
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 grid sm:grid-cols-3 gap-4 text-right">
            <div>
              <p className="text-xs text-slate-500">Total devengado</p>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{formatCOP(selected.totalDevengado)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total deducciones</p>
              <p className="text-lg font-bold text-red-600 tabular-nums">-{formatCOP(selected.totalDeducciones)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Neto a pagar</p>
              <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCOP(selected.totalNeto)}</p>
            </div>
          </div>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generar período de nómina" size="md">
        <form onSubmit={handleSubmit((v) => generarMut.mutate(v))} className="space-y-4">
          <Input label="Nombre del período *" placeholder="Ej. Mayo 2026" error={errors.nombre?.message} {...register('nombre')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha inicio *" type="date" error={errors.fechaInicio?.message} {...register('fechaInicio')} />
            <Input label="Fecha fin *" type="date" error={errors.fechaFin?.message} {...register('fechaFin')} />
          </div>
          <Select label="Periodicidad" options={[
            { value: 'MENSUAL', label: 'Mensual' },
            { value: 'QUINCENAL', label: 'Quincenal' },
          ]} {...register('periodicidad')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={generarMut.isPending}>
              <Calculator className="h-4 w-4" /> Generar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
