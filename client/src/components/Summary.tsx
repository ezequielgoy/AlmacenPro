import { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ProjectSelect } from './ProjectSelect';

interface Warehouse {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  warehouseId: string;
}

interface Project {
  id: string;
  name: string;
}

interface SummaryProps {
  warehouses: Warehouse[];
  inventory: InventoryItem[];
  pendingChanges: { [key: string]: number };
  onPendingChangesUpdate: React.Dispatch<
    React.SetStateAction<{ [key: string]: number }>
  >;
  onConfirm: (
    finalChanges: { [key: string]: number },
    meta: { requestedBy: string; project: string }
  ) => void | Promise<void>;
  onBack: () => void;
  projects: Project[];
}

export function Summary({
  warehouses,
  inventory,
  pendingChanges,
  onPendingChangesUpdate,
  onConfirm,
  onBack,
  projects,
}: SummaryProps) {
  const [requestedBy, setRequestedBy] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const itemsWithChanges = useMemo(
    () =>
      inventory.filter((item) => {
        const delta = pendingChanges[item.id];
        return typeof delta === 'number' && delta !== 0;
      }),
    [inventory, pendingChanges]
  );

  const warehouseName = useMemo(() => {
    if (itemsWithChanges.length === 0) return '';
    const wId = itemsWithChanges[0].warehouseId;
    return (
      warehouses.find((w) => w.id === wId)?.name ??
      'Selected warehouse'
    );
  }, [itemsWithChanges, warehouses]);

  const handleItemExtractionChange = (
    itemId: string,
    amount: number,
    maxStock: number
  ) => {
    onPendingChangesUpdate((prev) => {
      const safeAmount = Math.max(0, Math.min(amount, maxStock));

      if (safeAmount === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [itemId]: -safeAmount,
      };
    });
  };

  const handleConfirmClick = async () => {
    const trimmedRequestedBy = requestedBy.trim();
    if (!trimmedRequestedBy) {
      alert('Please fill in who requested the withdrawal.');
      return;
    }

    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    if (!selectedProject) {
      alert('Please select a project.');
      return;
    }

    if (itemsWithChanges.length === 0) {
      alert('There are no changes to confirm.');
      return;
    }

    await onConfirm(pendingChanges, {
      requestedBy: trimmedRequestedBy,
      project: selectedProject.name,
    });
  };

  const canConfirm =
    itemsWithChanges.length > 0 &&
    requestedBy.trim().length > 0 &&
    !!selectedProjectId;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Atras
          </Button>
          <div>
            <h1 className="leading-tight">Resumen orden de retiro</h1>
            {warehouseName && (
              <p className="text-sm text-slate-500">
                Deposito: <span className="font-medium">{warehouseName}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 flex-1 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Productos a retirar
          </h2>

          {itemsWithChanges.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              No hay productos a retirar.
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-auto">
              {itemsWithChanges.map((item) => {
                const delta = pendingChanges[item.id] || 0;
                const extractionAmount = delta < 0 ? -delta : 0;
                const newStock = item.currentStock + delta;

                return (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg flex items-center justify-between gap-4 bg-slate-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800 mb-1">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-600">
                          Cantidad en stock: {item.currentStock}
                        </span>
                        {delta !== 0 && (
                          <span className="text-red-600">
                            → {newStock} ({delta})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-slate-500">
                        Cantidad a Retirar
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={item.currentStock}
                        value={extractionAmount}
                        onChange={(e) =>
                          handleItemExtractionChange(
                            item.id,
                            parseInt(e.target.value || '0', 10),
                            item.currentStock
                          )
                        }
                        className="w-24 text-right"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 border-t pt-6 space-y-4">

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="requestedBy"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Quien solicito el retiro
                </label>
                <Input
                  id="requestedBy"
                  placeholder="Ingrese el nombre de la persona que solicito el retiro"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Proyecto
                </label>
                <ProjectSelect
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  onChange={setSelectedProjectId}
                  placeholder="Seleccione un proyecto"
                />
                {projects.length === 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    No se definio el proyecto. Si no esta en la lista pedir a un manager que lo cree.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t flex justify-end">
            <Button
              onClick={handleConfirmClick}
              size="lg"
              disabled={!canConfirm}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar retiro
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
