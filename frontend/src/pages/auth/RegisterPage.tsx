import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from '@/components/layout/AuthShell';
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
  const [step, setStep] = useState<1 | 2>(1);

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      empresa: { nit: '', razonSocial: '', nombreComercial: '', email: '', telefono: '', ciudad: '' },
      admin: { nombre: '', apellido: '', email: '', password: '' },
    },
  });

  const next = async () => {
    const ok = await trigger(['empresa.nit', 'empresa.razonSocial', 'empresa.email']);
    if (ok) setStep(2);
  };

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
    <AuthShell title="Crea tu empresa" subtitle={step === 1 ? 'Paso 1 de 2 · Datos de la empresa' : 'Paso 2 de 2 · Administrador'}>
      <div className="flex items-center gap-2 mb-6">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-gradient-brand' : 'bg-zinc-200 dark:bg-white/[0.08]'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-gradient-brand' : 'bg-zinc-200 dark:bg-white/[0.08]'}`} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 ? (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="NIT *" placeholder="900123456-7" error={errors.empresa?.nit?.message} {...register('empresa.nit')} />
              <Input label="Ciudad" placeholder="Bogotá" {...register('empresa.ciudad')} />
            </div>
            <Input label="Razón social *" placeholder="Mi Empresa S.A.S" error={errors.empresa?.razonSocial?.message} {...register('empresa.razonSocial')} />
            <Input label="Nombre comercial" placeholder="Mi Empresa" {...register('empresa.nombreComercial')} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Teléfono" placeholder="+57 ..." {...register('empresa.telefono')} />
              <Input label="Email empresa" type="email" placeholder="contacto@empresa.com" error={errors.empresa?.email?.message} {...register('empresa.email')} />
            </div>
            <Button type="button" className="w-full" size="lg" onClick={next}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Nombre *" error={errors.admin?.nombre?.message} {...register('admin.nombre')} />
              <Input label="Apellido *" error={errors.admin?.apellido?.message} {...register('admin.apellido')} />
            </div>
            <Input label="Email *" type="email" error={errors.admin?.email?.message} {...register('admin.email')} />
            <Input
              label="Contraseña *"
              type="password"
              hint="Mínimo 8 caracteres con mayúscula, minúscula y dígito"
              error={errors.admin?.password?.message}
              {...register('admin.password')}
            />
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" size="lg" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button type="submit" className="flex-1" loading={loading} size="lg">
                Crear empresa
              </Button>
            </div>
          </>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-ink-300">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-semibold text-zinc-900 hover:text-zinc-700 underline underline-offset-2 dark:text-violet-300 dark:hover:text-violet-200 dark:no-underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
