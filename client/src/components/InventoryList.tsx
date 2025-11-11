import { InventoryItem } from './InventoryItem';

interface Item {
  id: string;
  name: string;
  currentStock: number;
}

interface InventoryListProps {
  items: Item[];
  pendingChanges: { [key: string]: number };
  onExtractionChange: (itemId: string, amount: number, maxStock: number) => void;
  onDeleteItem?: (itemId: string) => void;
  canDelete?: boolean;
}

export function InventoryList({
  items,
  pendingChanges,
  onExtractionChange,
  onDeleteItem,
  canDelete = false,
}: InventoryListProps) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No hay productos en este deposito
      </div>
    );
  }

  return (
    <div className="divide-y">
      {items.map((item) => {
        const pendingChange = pendingChanges[item.id] || 0;
        const extractionAmount = pendingChange < 0 ? -pendingChange : 0;

        return (
          <InventoryItem
            key={item.id}
            item={item}
            pendingChange={pendingChange}
            extractionAmount={extractionAmount}
            onExtractionChange={(amount) =>
              onExtractionChange(item.id, amount, item.currentStock)
            }
            canDelete={canDelete}
            onDelete={() => onDeleteItem?.(item.id)}
          />
        );
      })}
    </div>
  );
}
