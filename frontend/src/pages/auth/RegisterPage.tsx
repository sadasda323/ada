import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { extractErrorMessage } from '@/lib/api';

const schema = z.object({
  empresa: z.object({
    nit: z.string().min(5, 'Mínimo 5 caracteres').max(20),
    razonSocial: z.string().min(2, 'Requerido').max(200),
    nombreComercial: z.string().max(200).optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    telefono: z.string().max(30).optional(),
    ciudad: z.string().max(100).optional(),
  }),
  admin: z.object({
    nombre: z.string().min(1, 'Requerido').max(100),
    apellido: z.string().min(1, 'Requerido').max(100),
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe tener mayúscula')
      .regex(/[a-z]/, 'Debe tener minúscula')
      .regex(/\d/, 'Debe tener un dígito'),
  }),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      empresa: { nit: '', razonSocial: '', nombreComercial: '', email: '', telefono: '', ciudad: '' },
      admin: { nombre: '', apellido: '', email: '', password: '' },
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const data = await authApi.register({
        empresa: { ...values.empresa, email: values.empresa.email || undefined },
        admin: values.admin,
      });
      setAuth(data);
      toast.success('Empresa creada correctamente');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50 px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-600 text-white font-bold flex items-center justify-center text-lg shadow-elevated">
            HR
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Crear empresa</h1>
          <p className="text-sm text-slate-500">Configura tu primer admin para empezar</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated p-8 animate-fade-in">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Datos de la empresa</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="NIT *" placeholder="900123456-7" error={errors.empresa?.nit?.message} {...register('empresa.nit')} />
                <Input label="Razón social *" placeholder="Mi Empresa S.A.S" error={errors.empresa?.razonSocial?.message} {...register('empresa.razonSocial')} />
                <Input label="Nombre comercial" placeholder="Mi Empresa" {...register('empresa.nombreComercial')} />
                <Input label="Ciudad" placeholder="Bogotá" {...register('empresa.ciudad')} />
                <Input label="Teléfono" placeholder="+57 ..." {...register('empresa.telefono')} />
                <Input label="Email empresa" type="email" placeholder="contacto@empresa.com" error={errors.empresa?.email?.message} {...register('empresa.email')} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Administrador</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Nombre *" error={errors.admin?.nombre?.message} {...register('admin.nombre')} />
                <Input label="Apellido *" error={errors.admin?.apellido?.message} {...register('admin.apellido')} />
                <Input label="Email *" type="email" error={errors.admin?.email?.message} {...register('admin.email')} />
                <Input
                  label="Contraseña *"
                  type="password"
                  hint="Mínimo 8 caracteres con mayúscula, minúscula y dígito"
                  error={errors.admin?.password?.message}
                  {...register('admin.password')}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" loading={loading} size="lg">
              Crear empresa
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
