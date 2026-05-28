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
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Requerido'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const data = await authApi.login(values.email, values.password);
      setAuth(data);
      toast.success(`Bienvenido, ${data.user.nombre}`);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-600 text-white font-bold flex items-center justify-center text-lg shadow-elevated">
            HR
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">HRCO</h1>
          <p className="text-sm text-slate-500">Sistema de gestión de RRHH y nómina</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated p-8 animate-fade-in">
          <h2 className="text-lg font-semibold text-slate-900">Iniciar sesión</h2>
          <p className="text-sm text-slate-500">Ingresa con tus credenciales</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
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
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Aún no tienes empresa registrada?{' '}
            <Link to="/registro" className="font-medium text-brand-600 hover:text-brand-700">
              Crear empresa
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Demo: admin@hrco.test / Admin123!
        </p>
      </div>
    </div>
  );
}
