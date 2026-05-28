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
import { areasApi } from '@/services/api.service';
import { extractErrorMessage } from '@/lib/api';
import type { Area } from '@/types';

const schema = z.object({
  nombre: z.string().min(1, 'Requerido').max(120),
  descripcion: z.string().max(500).optional(),
  activa: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export function AreasPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Area | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['areas', { search, page }],
    queryFn: () => areasApi.list({ q: search, page, pageSize: 20 }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', descripcion: '', activa: true },
  });

  const onOpen = (a?: Area) => {
    setEditing(a ?? null);
    reset({ nombre: a?.nombre ?? '', descripcion: a?.descripcion ?? '', activa: a?.activa ?? true });
    setModalOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: (v: FormValues) => editing ? areasApi.update(editing.id, v) : areasApi.create(v),
    onSuccess: () => {
      toast.success(editing ? 'Área actualizada' : 'Área creada');
      qc.invalidateQueries({ queryKey: ['areas'] });
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => areasApi.remove(id),
    onSuccess: () => {
      toast.success('Área eliminada');
      qc.invalidateQueries({ queryKey: ['areas'] });
      setConfirmId(null);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Áreas</h1>
          <p className="text-sm text-slate-500">Departamentos de tu empresa</p>
        </div>
        <Button onClick={() => onOpen()}>
          <Plus className="h-4 w-4" /> Nueva área
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input className="pl-9" placeholder="Buscar área..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Table
        columns={[
          { key: 'nombre', header: 'Nombre', render: (a) => <span className="font-medium text-slate-900">{a.nombre}</span> },
          { key: 'descripcion', header: 'Descripción', render: (a) => a.descripcion || '—' },
          {
            key: 'activa', header: 'Estado',
            render: (a) => <Badge tone={a.activa ? 'success' : 'default'}>{a.activa ? 'Activa' : 'Inactiva'}</Badge>,
          },
          {
            key: '_actions', header: '', className: 'w-24 text-right',
            render: (a) => (
              <div className="flex justify-end gap-1">
                <button onClick={() => onOpen(a)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setConfirmId(a.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500" aria-label="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]}
        rows={data?.items ?? []}
        rowKey={(a) => a.id}
        loading={isLoading}
        emptyText="No hay áreas. Crea la primera."
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar área' : 'Nueva área'} size="md">
        <form onSubmit={handleSubmit((v) => saveMut.mutate(v))} className="space-y-4">
          <Input label="Nombre *" error={errors.nombre?.message} {...register('nombre')} />
          <Input label="Descripción" {...register('descripcion')} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('activa')} className="rounded text-brand-600" /> Activa
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saveMut.isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar área"
        message="¿Seguro que deseas eliminar esta área? Esta acción no se puede deshacer."
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteMut.mutate(confirmId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
