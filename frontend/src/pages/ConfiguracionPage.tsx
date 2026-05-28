import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { empresaApi } from '@/services/api.service';
import { extractErrorMessage } from '@/lib/api';

const schema = z.object({
  razonSocial: z.string().min(2).max(200),
  nombreComercial: z.string().max(200).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().max(30).optional(),
  direccion: z.string().max(300).optional(),
  ciudad: z.string().max(100).optional(),
  salarioMinimo: z.string().optional(),
  auxilioTransporte: z.string().optional(),
  porcentajeSalud: z.string().optional(),
  porcentajePension: z.string().optional(),
  recargoExtraDiurna: z.string().optional(),
  recargoExtraNocturna: z.string().optional(),
  recargoExtraDominical: z.string().optional(),
  periodicidadNomina: z.enum(['MENSUAL', 'QUINCENAL']).optional(),
});
type FormValues = z.infer<typeof schema>;

export function ConfiguracionPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['empresa'], queryFn: empresaApi.get });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) {
      reset({
        razonSocial: data.razonSocial,
        nombreComercial: data.nombreComercial,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        ciudad: data.ciudad,
        salarioMinimo: data.salarioMinimo,
        auxilioTransporte: data.auxilioTransporte,
        porcentajeSalud: data.porcentajeSalud,
        porcentajePension: data.porcentajePension,
        recargoExtraDiurna: data.recargoExtraDiurna,
        recargoExtraNocturna: data.recargoExtraNocturna,
        recargoExtraDominical: data.recargoExtraDominical,
        periodicidadNomina: data.periodicidadNomina,
      });
    }
  }, [data, reset]);

  const saveMut = useMutation({
    mutationFn: (v: FormValues) => empresaApi.update({ ...v, email: v.email || undefined }),
    onSuccess: () => {
      toast.success('Configuración guardada');
      qc.invalidateQueries({ queryKey: ['empresa'] });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  if (isLoading) return <p className="text-zinc-500 dark:text-ink-300">Cargando…</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistema"
        title="Configuración"
        description="Datos de la empresa y reglas de nómina"
      />

      <form onSubmit={handleSubmit((v) => saveMut.mutate(v))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos generales</CardTitle>
            <CardDescription>NIT: {data?.nit}</CardDescription>
          </CardHeader>
          <CardBody className="grid sm:grid-cols-2 gap-4">
            <Input label="Razón social *" error={errors.razonSocial?.message} {...register('razonSocial')} />
            <Input label="Nombre comercial" {...register('nombreComercial')} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Teléfono" {...register('telefono')} />
            <Input label="Dirección" {...register('direccion')} className="sm:col-span-2" />
            <Input label="Ciudad" {...register('ciudad')} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reglas de nómina (Colombia)</CardTitle>
            <CardDescription>Valores y porcentajes que se aplican al calcular cada período</CardDescription>
          </CardHeader>
          <CardBody className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Salario mínimo (COP)" type="number" step="0.01" {...register('salarioMinimo')} />
            <Input label="Auxilio transporte (COP)" type="number" step="0.01" {...register('auxilioTransporte')} />
            <Select label="Periodicidad" options={[
              { value: 'MENSUAL', label: 'Mensual' },
              { value: 'QUINCENAL', label: 'Quincenal' },
            ]} {...register('periodicidadNomina')} />
            <Input label="% Salud (decimal)" type="number" step="0.0001" hint="0.04 = 4%" {...register('porcentajeSalud')} />
            <Input label="% Pensión (decimal)" type="number" step="0.0001" hint="0.04 = 4%" {...register('porcentajePension')} />
            <div />
            <Input label="Recargo H.E. diurna" type="number" step="0.01" hint="0.25 = 25%" {...register('recargoExtraDiurna')} />
            <Input label="Recargo H.E. nocturna" type="number" step="0.01" hint="0.75 = 75%" {...register('recargoExtraNocturna')} />
            <Input label="Recargo H.E. dominical" type="number" step="0.01" hint="1.00 = 100%" {...register('recargoExtraDominical')} />
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={saveMut.isPending}>
            <Save className="h-4 w-4" /> Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
