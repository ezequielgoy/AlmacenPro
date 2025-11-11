import { Label } from './ui/label';
import { Warehouse } from 'lucide-react';

interface WarehouseType {
  id: string;
  name: string;
}

interface WarehouseSelectorProps {
  warehouses: WarehouseType[];
  selectedWarehouse: string;
  onWarehouseChange: (warehouseId: string) => void;
}

export function WarehouseSelector({
  warehouses,
  selectedWarehouse,
  onWarehouseChange,
}: WarehouseSelectorProps) {
  return (
    <div>
      <Label className="mb-3 block">Seleccione un Deposito</Label>
      <div className="inline-flex gap-2 p-1 bg-slate-100 rounded-lg">
        {warehouses.map((warehouse) => {
          const isSelected = warehouse.id === selectedWarehouse;
          return (
            <button
              key={warehouse.id}
              onClick={() => onWarehouseChange(warehouse.id)}
              className={`
                px-4 py-2 rounded-md transition-all duration-200
                flex items-center gap-2
                ${
                  isSelected
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }
              `}
            >
              <Warehouse className="h-4 w-4" />
              <span>{warehouse.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
