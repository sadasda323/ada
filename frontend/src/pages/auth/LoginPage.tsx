import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell, useAuthShell } from '@/components/layout/AuthShell';
import { authApi } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { extractErrorMessage } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Requerido'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const shell = useAuthShell();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const data = await authApi.login(values.email, values.password);
      setAuth(data);
      toast.success(`Bienvenido, ${data.user.nombre}`);
      // Disparar animación de cortinas; al completar navegar al dashboard
      shell.close();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Bienvenido de vuelta"
      subtitle="Ingresa con tus credenciales para continuar"
      closing={shell.closing}
      onClosed={() => navigate('/dashboard', { replace: true })}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="admin@empresa.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" loading={loading} size="lg">
          Entrar <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Aún no tienes empresa?{' '}
        <Link
          to="/registro"
          className="font-semibold text-zinc-900 hover:text-zinc-700 underline underline-offset-2 dark:text-violet-300 dark:hover:text-violet-200 dark:no-underline"
        >
          Crear cuenta
        </Link>
      </p>

      <div className="mt-8 p-3 rounded-xl bg-zinc-100/70 border border-zinc-200 text-center dark:bg-white/[0.03] dark:border-white/[0.06]">
        <p className="text-[11px] uppercase tracking-wider text-zinc-700 dark:text-violet-300/80 font-semibold">
          Demo
        </p>
        <p className="text-xs text-zinc-700 dark:text-ink-200 mt-1 font-mono">
          admin@hrco.test / Admin123!
        </p>
      </div>
    </AuthShell>
  );
}
