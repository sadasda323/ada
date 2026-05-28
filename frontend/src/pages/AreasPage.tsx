import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
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
      <PageHeader
        eyebrow="Estructura"
        title="Áreas"
        description="Departamentos de tu empresa"
        actions={
          <Button onClick={() => onOpen()}>
            <Plus className="h-4 w-4" /> Nueva área
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-ink-400" />
        <Input className="pl-9" placeholder="Buscar área..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Table
        columns={[
          {
            key: 'nombre', header: 'Nombre',
            render: (a) => (
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-zinc-100 border border-zinc-200 dark:bg-violet-500/15 dark:border-violet-400/20 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-zinc-900 dark:text-violet-300" />
                </div>
                <span className="font-medium text-zinc-900 dark:text-ink-100">{a.nombre}</span>
              </div>
            ),
          },
          { key: 'descripcion', header: 'Descripción', render: (a) => <span className="text-zinc-500 dark:text-ink-300">{a.descripcion || '—'}</span> },
          {
            key: 'activa', header: 'Estado',
            render: (a) => <Badge tone={a.activa ? 'success' : 'default'} dot>{a.activa ? 'Activa' : 'Inactiva'}</Badge>,
          },
          {
            key: '_actions', header: '', className: 'w-24 text-right',
            render: (a) => (
              <div className="flex justify-end gap-1">
                <button onClick={() => onOpen(a)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-500 dark:text-ink-300 hover:text-zinc-900 dark:hover:text-white transition-colors" aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setConfirmId(a.id)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-500 dark:text-ink-300 hover:text-rose-600 dark:hover:text-rose-300 transition-colors" aria-label="Eliminar">
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
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-ink-200">
            <input type="checkbox" {...register('activa')} className="h-4 w-4 rounded text-zinc-900 dark:text-violet-500 focus:ring-zinc-900/20 dark:focus:ring-violet-500/40" /> Activa
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
