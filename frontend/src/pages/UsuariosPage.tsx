import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { empleadosApi, usuariosApi } from '@/services/api.service';
import { extractErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@/types';

const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe tener mayúscula')
  .regex(/[a-z]/, 'Debe tener minúscula')
  .regex(/\d/, 'Debe tener un dígito');

const schemaCreate = z.object({
  email: z.string().email(),
  password: passwordSchema,
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  rol: z.string().min(1),
  empleadoId: z.string().optional(),
});

const schemaEdit = z.object({
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  rol: z.string().min(1),
  activo: z.boolean().optional(),
  empleadoId: z.string().optional(),
  password: z.string().optional(),
});

type CreateValues = z.infer<typeof schemaCreate>;
type EditValues = z.infer<typeof schemaEdit>;

const rolLabel: Record<string, string> = {
  ADMIN_EMPRESA: 'Administrador',
  RRHH: 'RRHH',
  CONTADOR: 'Contador',
  EMPLEADO: 'Empleado',
};

export function UsuariosPage() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['usuarios'], queryFn: () => usuariosApi.list({ pageSize: 50 }) });
  const empleadosQ = useQuery({ queryKey: ['empleados-all'], queryFn: () => empleadosApi.list({ pageSize: 200 }) });

  const createForm = useForm<CreateValues>({ resolver: zodResolver(schemaCreate) });
  const editForm = useForm<EditValues>({ resolver: zodResolver(schemaEdit) });

  const onOpen = (u?: User) => {
    setEditing(u ?? null);
    if (u) {
      editForm.reset({
        nombre: u.nombre, apellido: u.apellido, rol: u.rol, activo: true,
        empleadoId: u.empleadoId ?? '', password: '',
      });
    } else {
      createForm.reset({ email: '', password: '', nombre: '', apellido: '', rol: 'EMPLEADO', empleadoId: '' });
    }
    setModalOpen(true);
  };

  const createMut = useMutation({
    mutationFn: (v: CreateValues) => usuariosApi.create({
      ...v,
      empleadoId: v.empleadoId || undefined,
    }),
    onSuccess: () => {
      toast.success('Usuario creado');
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const updateMut = useMutation({
    mutationFn: (v: EditValues) => usuariosApi.update(editing!.id, {
      ...v,
      empleadoId: v.empleadoId || undefined,
      password: v.password || undefined,
    }),
    onSuccess: () => {
      toast.success('Usuario actualizado');
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      setModalOpen(false);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => usuariosApi.remove(id),
    onSuccess: () => { toast.success('Usuario eliminado'); qc.invalidateQueries({ queryKey: ['usuarios'] }); setConfirmId(null); },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const rolOptions = [
    { value: 'ADMIN_EMPRESA', label: 'Administrador de Empresa' },
    { value: 'RRHH', label: 'Recursos Humanos' },
    { value: 'CONTADOR', label: 'Contador' },
    { value: 'EMPLEADO', label: 'Empleado' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500">Cuentas de acceso al sistema</p>
        </div>
        <Button onClick={() => onOpen()}>
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      <Table
        columns={[
          {
            key: 'nombre', header: 'Usuario',
            render: (u: User) => (
              <div>
                <div className="font-medium text-slate-900">{u.nombre} {u.apellido}</div>
                <div className="text-xs text-slate-500">{u.email}</div>
              </div>
            ),
          },
          { key: 'rol', header: 'Rol', render: (u) => <Badge tone="brand">{rolLabel[u.rol] || u.rol}</Badge> },
          {
            key: '_actions', header: '', className: 'w-24 text-right',
            render: (u) => (
              <div className="flex justify-end gap-1">
                <button onClick={() => onOpen(u)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"><Pencil className="h-4 w-4" /></button>
                {u.id !== me?.id && (
                  <button onClick={() => setConfirmId(u.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            ),
          },
        ]}
        rows={data?.items ?? []}
        rowKey={(u) => u.id}
        loading={isLoading}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'} size="md">
        {editing ? (
          <form onSubmit={editForm.handleSubmit((v) => updateMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre" error={editForm.formState.errors.nombre?.message} {...editForm.register('nombre')} />
              <Input label="Apellido" error={editForm.formState.errors.apellido?.message} {...editForm.register('apellido')} />
            </div>
            <Select label="Rol" options={rolOptions} {...editForm.register('rol')} />
            <Select
              label="Empleado vinculado"
              placeholder="Sin vincular"
              options={(empleadosQ.data?.items ?? []).map((e) => ({ value: e.id, label: `${e.nombre} ${e.apellido}` }))}
              {...editForm.register('empleadoId')}
            />
            <Input label="Nueva contraseña" type="password" hint="Déjala vacía si no quieres cambiarla" {...editForm.register('password')} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" loading={updateMut.isPending}>Guardar</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={createForm.handleSubmit((v) => createMut.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre" error={createForm.formState.errors.nombre?.message} {...createForm.register('nombre')} />
              <Input label="Apellido" error={createForm.formState.errors.apellido?.message} {...createForm.register('apellido')} />
            </div>
            <Input label="Email" type="email" error={createForm.formState.errors.email?.message} {...createForm.register('email')} />
            <Input
              label="Contraseña"
              type="password"
              hint="Mínimo 8, con mayúscula, minúscula y dígito"
              error={createForm.formState.errors.password?.message}
              {...createForm.register('password')}
            />
            <Select label="Rol" options={rolOptions} {...createForm.register('rol')} />
            <Select
              label="Empleado vinculado"
              placeholder="Sin vincular"
              options={(empleadosQ.data?.items ?? []).map((e) => ({ value: e.id, label: `${e.nombre} ${e.apellido}` }))}
              {...createForm.register('empleadoId')}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" loading={createMut.isPending}>Crear</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        title="Eliminar usuario"
        message="¿Seguro que quieres eliminar este usuario?"
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && deleteMut.mutate(confirmId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
