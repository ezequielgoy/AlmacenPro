import { Button } from './ui/button';
import { CheckCircle2 } from 'lucide-react';

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

interface ConfirmationProps {
  warehouses: Warehouse[];
  inventory: InventoryItem[];
  confirmedChanges: { [key: string]: number };
  onBackToHome: () => void;
}

export function Confirmation({
  warehouses,
  inventory,
  confirmedChanges,
  onBackToHome,
}: ConfirmationProps) {
  // Group items by warehouse
  const changesByWarehouse = warehouses.map((warehouse) => {
    const items = inventory
      .filter((item) => item.warehouseId === warehouse.id)
      .map((item) => ({
        ...item,
        change: confirmedChanges[item.id] || 0,
      }))
      .filter((item) => item.change !== 0);

    return {
      warehouse,
      items,
    };
  }).filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <h1>Confirmacion</h1>
          </div>
          <p className="text-slate-600">La extraccion de productos se realizo correctamente</p>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-6 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="space-y-6">
            {changesByWarehouse.map(({ warehouse, items }) => (
              <div key={warehouse.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b bg-slate-50">
                  <h2>{warehouse.name}</h2>
                </div>
                <div className="divide-y">
                  {items.map((item) => {
                    const oldStock = item.currentStock;
                    const newStock = item.currentStock + item.change;
                    return (
                      <div key={item.id} className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="mb-1">{item.name}</h3>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-600">
                                {oldStock} → {newStock}
                              </span>
                              <span
                                className={`${
                                  item.change > 0 ? 'text-blue-600' : 'text-red-600'
                                }`}
                              >
                                ({item.change > 0 ? '+' : ''}
                                {item.change})
                              </span>
                            </div>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-sm ${
                              item.change > 0
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {item.change > 0 ? 'Agregar' : 'Retirar'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t bg-white rounded-lg shadow-lg p-4">
          <Button onClick={onBackToHome} className="w-full" size="lg">
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
}
