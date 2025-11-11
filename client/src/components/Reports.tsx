import { useEffect, useState, useMemo } from 'react';
import { WarehouseSelector } from './WarehouseSelector';
import { Button } from './ui/button';
import {
  ArrowLeft,
  Calendar,
  User,
  ClipboardList,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Input } from './ui/input';
import { ProjectSelect } from './ProjectSelect';

const API_BASE = '/api';
const PAGE_SIZE = 10;

interface Warehouse {
  id: string;
  name: string;
}

interface MovementItem {
  id: string;
  name: string;
  delta: number;
  previousStock: number;
  newStock: number;
}

interface MovementRecord {
  id: string;
  timestamp: string;
  username: string;
  warehouseName: string;
  requestedBy?: string;
  project?: string;
  items: MovementItem[];
}

interface Project {
  id: string;
  name: string;
}

interface ReportsProps {
  warehouses: Warehouse[];
  token: string;
  onBack: () => void;
  projects: Project[];
}

export function Reports({ warehouses, token, onBack, projects }: ReportsProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(
    warehouses[0]?.id || ''
  );
  const [records, setRecords] = useState<MovementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const loadMovements = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedWarehouse) params.append('warehouseId', selectedWarehouse);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      if (selectedProjectId) {
        const selectedProject = projects.find((p) => p.id === selectedProjectId);
        if (selectedProject) {
          params.append('project', selectedProject.name);
        }
      }

      const res = await fetch(
        `${API_BASE}/movements${params.toString() ? `?${params.toString()}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();

      const mapped: MovementRecord[] = data.map((m: any) => ({
        id: m._id ?? m.id,
        timestamp: m.createdAt,
        username: m.user?.username ?? 'Unknown',
        warehouseName: m.warehouse?.name ?? 'Unknown warehouse',
        requestedBy: m.requestedBy ?? '',
        project: m.project ?? '',
        items: (m.items || []).map((it: any) => ({
          id: it.inventoryItem ?? '',
          name: it.itemName ?? 'Deleted product',
          delta: it.delta,
          previousStock: it.previousStock,
          newStock: it.newStock,
        })),
      }));

      setRecords(mapped);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError('Error loading reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && selectedWarehouse) {
      loadMovements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedWarehouse, fromDate, toDate, selectedProjectId]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleDownloadExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedWarehouse) params.append('warehouseId', selectedWarehouse);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      if (selectedProjectId) {
        const selectedProject = projects.find((p) => p.id === selectedProjectId);
        if (selectedProject) {
          params.append('project', selectedProject.name);
        }
      }

      const res = await fetch(
        `${API_BASE}/movements/export${
          params.toString() ? `?${params.toString()}` : ''
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error('Error exporting Excel:', text);
        alert('Failed to export Excel.');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stock-movements.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Network error while exporting Excel.');
    }
  };

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  }, [records.length]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return records.slice(start, end);
  }, [records, currentPage]);

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Atras
            </Button>
            
          </div>
          <h1>Reportes de Movimientos</h1>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div>
                <span className="block text-xs font-medium text-slate-700 mb-1">
                  Deposito
                </span>
                <WarehouseSelector
                  warehouses={warehouses}
                  selectedWarehouse={selectedWarehouse}
                  onWarehouseChange={setSelectedWarehouse}
                />
              </div>

              <div className="flex gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Desde
                  </label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hasta
                  </label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="min-w-[200px]">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Filtro por Proyecto
                </label>
                <ProjectSelect
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  onChange={setSelectedProjectId}
                  placeholder="Ingrese el proyecto"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadMovements}>
                Recargar
              </Button>
              <Button variant="default" size="sm" onClick={handleDownloadExcel}>
                <Download className="h-4 w-4 mr-2" />
                Descargar Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-slate-500">
            Cargando movimientos...
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <p className="text-slate-500">
              No hay movimientos con el filtro indicado.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedRecords.map((record) => {
                const additions = record.items.filter((i) => i.delta > 0);
                const extractions = record.items.filter((i) => i.delta < 0);

                return (
                  <div
                    key={record.id}
                    className="bg-white rounded-lg shadow-sm border"
                  >
                    <div className="px-4 py-3 border-b flex justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {record.warehouseName}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-500" />
                            {record.username}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            {formatDate(record.timestamp)}
                          </div>
                        </div>
                      </div>
                      {(record.requestedBy || record.project) && (
                        <div className="text-right text-xs text-slate-600">
                          {record.requestedBy && (
                            <p>
                              <strong>Solicitado por:</strong>{' '}
                              {record.requestedBy}
                            </p>
                          )}
                          {record.project && (
                            <p>
                              <strong>Proyecto:</strong> {record.project}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-4 text-sm">
                      {extractions.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 text-red-600 mb-1">
                            <ClipboardList className="h-4 w-4" />
                            <span>Retiro</span>
                          </div>
                          <p className="ml-6 text-slate-700">
                            {extractions
                              .map(
                                (i) => `${Math.abs(i.delta)} × ${i.name}`
                              )
                              .join(', ')}
                          </p>
                        </div>
                      )}
                      {additions.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-green-600 mb-1">
                            <ClipboardList className="h-4 w-4" />
                            <span>Agrego</span>
                          </div>
                          <p className="ml-6 text-slate-700">
                            {additions
                              .map(
                                (i) => `${Math.abs(i.delta)} × ${i.name}`
                              )
                              .join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
              <div>
                Mostrando{' '}
                <span className="font-medium">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>{' '}
                -{' '}
                <span className="font-medium">
                  {Math.min(currentPage * PAGE_SIZE, records.length)}
                </span>{' '}
                de <span className="font-medium">{records.length}</span>{' '}
                movimientos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span>
                  Pagina{' '}
                  <span className="font-medium">{currentPage}</span> de{' '}
                  <span className="font-medium">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
