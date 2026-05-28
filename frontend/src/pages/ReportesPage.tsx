import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { nominaApi, reportesApi } from '@/services/api.service';
import { extractErrorMessage } from '@/lib/api';

export function ReportesPage() {
  const [estado, setEstado] = useState('');
  const [periodoId, setPeriodoId] = useState('');
  const periodosQ = useQuery({ queryKey: ['nomina-periodos'], queryFn: () => nominaApi.listar({ pageSize: 50 }) });

  const downloadEmpleados = async () => {
    try {
      const blob = await reportesApi.empleadosCSV(estado ? { estado } : undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `empleados_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const downloadNomina = async () => {
    if (!periodoId) {
      toast.error('Selecciona un período');
      return;
    }
    try {
      const blob = await reportesApi.nominaCSV(periodoId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomina_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
        <p className="text-sm text-slate-500">Exporta los datos de tu empresa</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-brand-600" /> Empleados</CardTitle>
            <CardDescription>Listado completo en CSV</CardDescription>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="Filtrar por estado"
              name="estadoEmp"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              placeholder="Todos"
              options={[
                { value: 'ACTIVO', label: 'Activos' },
                { value: 'INACTIVO', label: 'Inactivos' },
                { value: 'VACACIONES', label: 'En vacaciones' },
                { value: 'INCAPACIDAD', label: 'En incapacidad' },
                { value: 'RETIRADO', label: 'Retirados' },
              ]}
            />
            <Button onClick={downloadEmpleados}>
              <Download className="h-4 w-4" /> Descargar CSV
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-brand-600" /> Nómina</CardTitle>
            <CardDescription>Detalle por período</CardDescription>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="Período"
              name="periodo"
              value={periodoId}
              onChange={(e) => setPeriodoId(e.target.value)}
              placeholder="Selecciona período"
              options={(periodosQ.data?.items ?? []).map((p) => ({ value: p.id, label: p.nombre }))}
            />
            <Button onClick={downloadNomina} disabled={!periodoId}>
              <Download className="h-4 w-4" /> Descargar CSV
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
