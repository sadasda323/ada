import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { cargosApi } from '@/services/api.service';
import { extractErrorMessage } from '@/lib/api';
import { formatCOP } from '@/lib/utils';
import type { Cargo } from '@/types';

const schema = z.object({
  nombre: z.string().min(1, 'Requerido').max(150),
  descripcion: z.string().max(500).optional(),
  salarioBase: z.string().min(1, 'Requerido').refine((v) => !Number.isNaN(Number(v)), 'Número inválido'),
  activo: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CargosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Cargo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cargos', { search, page }],
    queryFn: () => cargosApi.list({ q: search, page, pageSize: 20 }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', descripcion: '', salarioBase: '', activo: true },
  });

  const onOpen = (c?: Cargo) => {
    setEditing(c ?? null);
    reset({
      nombre: c?.nombre ?? '',
      descripcion: c?.descripcion ?? '',
      salarioBase: c?.salarioBase ?? '',
      activo: c?.activo ?? true,
    });
    setModalOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: (v: FormValues) => editing ? cargosApi.update(editing.id, v) : cargosApi.create(v),
    onSuccess: () => {
      toast.success(editing ? 'Cargo actualizado' : 'Cargo creado');
      qc.invalidateQueries({ queryKey: ['cargos'] });
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => cargosApi.remove(id),
    onSuccess: () => {
      toast.success('Cargo eliminado');
      qc.invalidateQueries({ queryKey: ['cargos'] });
      setConfirmId(null);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cargos</h1>
          <p className="text-sm text-slate-500">Posiciones y salarios base</p>
        </div>
        <Button onClick={() => onOpen()}>
          <Plus className="h-4 w-4" /> Nuevo cargo
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input className="pl-9" placeholder="Buscar cargo..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Table
        columns={[
          { key: 'nombre', header: 'Nombre', render: (c) => <span className="font-medium text-slate-900">{c.nombre}</span> },
          { key: 'salarioBase', header: 'Salario base', render: (c) => <span className="tabular-nums">{formatCOP(c.salarioBase)}</span> },
          { key: 'descripcion', header: 'Descripción', render: (c) => c.descripcion || '—' },
          {
            key: 'activo', header: 'Estado',
            render: (c) => <Badge tone={c.activo ? 'success' : 'default'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>,
          },
          {
            key: '_actions', header: '', className: 'w-24 text-right',
            render: (c) => (
              <div className="flex justify-end gap-1">
                <button onClick={() => onOpen(c)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setConfirmId(c.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ),
          },
        ]}
        rows={data?.items ?? []}
        rowKey={(c) => c.id}
        loading={isLoading}
        emptyText="No hay cargos. Crea el primero."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar cargo' : 'Nuevo cargo'} size="md">
        <form onSubmit={handleSubmit((v) => saveMut.mutate(v))} className="space-y-4">
          <Input label="Nombre *" error={errors.nombre?.message} {...register('nombre')} />
          <Input
            label="Salario base (COP) *"
            type="number"
            min="0"
            step="0.01"
            error={errors.salarioBase?.message}
            {...register('salarioBase')}
          />
          <Input label="Descripción" {...register('descripcion')} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('activo')} className="rounded text-brand-600" /> Activo
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saveMut.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar cargo"
        message="¿Seguro? Empleados con este cargo quedarán sin asignación."
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteMut.mutate(confirmId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
