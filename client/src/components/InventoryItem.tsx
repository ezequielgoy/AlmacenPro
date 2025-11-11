import { Trash } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Item {
  id: string;
  name: string;
  currentStock: number;
}

interface InventoryItemProps {
  item: Item;
  pendingChange: number;        // delta (negativo si se extrae)
  extractionAmount: number;     // cantidad a retirar (0..stock)
  onExtractionChange: (amount: number) => void;
  canDelete?: boolean;
  onDelete?: () => void;
}

export function InventoryItem({
  item,
  pendingChange,
  extractionAmount,
  onExtractionChange,
  canDelete = false,
  onDelete,
}: InventoryItemProps) {
  const newStock = item.currentStock + pendingChange;

  const handleInputChange = (value: string) => {
    const raw = parseInt(value, 10);
    if (isNaN(raw) || raw < 0) {
      onExtractionChange(0);
      return;
    }
    const clamped = Math.min(raw, item.currentStock);
    onExtractionChange(clamped);
  };

  return (
    <div className="p-4 hover:bg-slate-50 transition-colors border-b last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="mb-1 font-medium text-slate-800">{item.name}</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">Cantidad en stock: {item.currentStock}</span>
            {pendingChange !== 0 && (
              <span
                className={`${
                  pendingChange > 0 ? 'text-blue-600' : 'text-red-600'
                }`}
              >
                → {newStock} ({pendingChange > 0 ? '+' : ''}
                {pendingChange})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-500 mb-1">
              Cantidad a retirar
            </span>
            <Input
              type="number"
              min={0}
              max={item.currentStock}
              value={extractionAmount}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-24 text-right"
            />
          </div>

          {canDelete && (
            <Button
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="bg-red-100 border-red-300 text-red-700 hover:bg-red-200 hover:text-red-800"
            >
              <Trash className="h-4 w-4 mr-1" />
              Borrar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
