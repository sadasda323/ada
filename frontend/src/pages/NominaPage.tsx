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
import { PageHeader } from '@/components/layout/PageHeader';
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
      <PageHeader
        eyebrow="Operación"
        title="Nómina"
        description="Genera, recalcula y liquida períodos"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo período
          </Button>
        }
      />

      <Card className="p-0">
        <Table<PeriodoNomina>
          columns={[
            { key: 'nombre', header: 'Período', render: (p) => <span className="font-medium text-zinc-900 dark:text-ink-100">{p.nombre}</span> },
            { key: 'fechaInicio', header: 'Inicio', render: (p) => <span className="text-zinc-500 dark:text-ink-300">{formatDate(p.fechaInicio)}</span> },
            { key: 'fechaFin', header: 'Fin', render: (p) => <span className="text-zinc-500 dark:text-ink-300">{formatDate(p.fechaFin)}</span> },
            { key: 'totalDevengado', header: 'Devengado', render: (p) => <span className="font-mono text-zinc-900 dark:text-ink-100">{formatCOP(p.totalDevengado)}</span> },
            { key: 'totalDeducciones', header: 'Deducciones', render: (p) => <span className="font-mono text-rose-600 dark:text-rose-300">-{formatCOP(p.totalDeducciones)}</span> },
            { key: 'totalNeto', header: 'Neto', render: (p) => <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-300">{formatCOP(p.totalNeto)}</span> },
            { key: 'estado', header: 'Estado', render: (p) => <Badge tone={estadoTone[p.estado]} dot>{p.estado}</Badge> },
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
          <div className="px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="section-eyebrow">Detalle</span>
              <h2 className="mt-1 h-display text-lg text-zinc-900 dark:text-white">{selected.nombre}</h2>
              <p className="text-xs text-zinc-500 dark:text-ink-400 mt-0.5">
                {formatDate(selected.fechaInicio)} – {formatDate(selected.fechaFin)} · {selected.detalles?.length ?? 0} empleados
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => downloadCSV(selected.id, selected.nombre)}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              {selected.estado === 'ABIERTO' && (
                <>
                  <Button variant="secondary" onClick={() => recalcMut.mutate(selected.id)} loading={recalcMut.isPending}>
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
                      <span className="font-medium text-zinc-900 dark:text-ink-100">
                        {d.empleado?.nombre} {d.empleado?.apellido}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-ink-400">{d.empleado?.documento}</span>
                    </div>
                  ),
                },
                { key: 'salarioBase', header: 'Salario', render: (d: any) => <span className="font-mono text-zinc-900 dark:text-ink-100">{formatCOP(d.salarioBase)}</span> },
                { key: 'auxilioTransporte', header: 'Aux. Trans.', render: (d: any) => <span className="font-mono text-zinc-700 dark:text-ink-200">{formatCOP(d.auxilioTransporte)}</span> },
                { key: 'totalDevengado', header: 'Devengado', render: (d: any) => <span className="font-mono text-zinc-900 dark:text-ink-100">{formatCOP(d.totalDevengado)}</span> },
                { key: 'salud', header: 'Salud', render: (d: any) => <span className="font-mono text-rose-600 dark:text-rose-300">-{formatCOP(d.salud)}</span> },
                { key: 'pension', header: 'Pensión', render: (d: any) => <span className="font-mono text-rose-600 dark:text-rose-300">-{formatCOP(d.pension)}</span> },
                { key: 'totalDeducciones', header: 'Deducciones', render: (d: any) => <span className="font-mono text-rose-600 dark:text-rose-300">-{formatCOP(d.totalDeducciones)}</span> },
                { key: 'neto', header: 'Neto', render: (d: any) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-300">{formatCOP(d.neto)}</span> },
              ]}
              rows={selected.detalles ?? []}
              rowKey={(d: any) => d.id}
              emptyText="Sin detalles"
            />
          </div>

          <div className="px-6 py-4 border-t border-zinc-100 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] grid sm:grid-cols-3 gap-4">
            <SummaryItem label="Total devengado" value={formatCOP(selected.totalDevengado)} accent="violet" />
            <SummaryItem label="Total deducciones" value={`-${formatCOP(selected.totalDeducciones)}`} accent="rose" />
            <SummaryItem label="Neto a pagar" value={formatCOP(selected.totalNeto)} accent="emerald" big />
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

function SummaryItem({
  label, value, accent, big,
}: {
  label: string; value: string; accent: 'violet' | 'rose' | 'emerald'; big?: boolean;
}) {
  const accentText = {
    violet: 'text-violet-600 dark:text-violet-300',
    rose: 'text-rose-600 dark:text-rose-300',
    emerald: 'text-emerald-600 dark:text-emerald-300',
  }[accent];
  return (
    <div className="rounded-xl bg-zinc-50/70 border border-zinc-100 dark:bg-white/[0.02] dark:border-white/[0.04] p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 dark:text-ink-400 font-semibold">{label}</p>
      <p className={`mt-1.5 font-mono ${big ? 'text-2xl' : 'text-lg'} font-bold ${accentText}`}>{value}</p>
    </div>
  );
}
