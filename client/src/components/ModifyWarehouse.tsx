import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft } from 'lucide-react';

const API_BASE = '/api';

interface Warehouse {
  id: string;
  name: string;
}

interface ModifyWarehouseProps {
  warehouses: Warehouse[];
  token: string;
  onWarehousesUpdate: (warehouses: Warehouse[]) => void;
  onBack: () => void;
}

export function ModifyWarehouse({
  warehouses,
  token,
  onWarehousesUpdate,
  onBack,
}: ModifyWarehouseProps) {
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddWarehouse = async () => {
    if (!newWarehouseName.trim()) {
      alert('Please enter a warehouse name');
      return;
    }

    try {
      setIsAdding(true);

      const res = await fetch(`${API_BASE}/warehouses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newWarehouseName }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error adding warehouse:', errorText);
        alert('Error adding warehouse. Please try again.');
        return;
      }

      const data = await res.json();
      const newWarehouse: Warehouse = {
        id: data._id ?? data.id,
        name: data.name,
      };

      onWarehousesUpdate([...warehouses, newWarehouse]);
      setNewWarehouseName('');
      alert(`Warehouse "${newWarehouse.name}" added successfully!`);
    } catch (error) {
      console.error(error);
      alert('Network error while adding warehouse.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteWarehouses = async () => {
    if (selectedWarehouses.length === 0) {
      alert('Please select at least one warehouse to delete');
      return;
    }

    const warehouseNames = selectedWarehouses
      .map((id) => warehouses.find((w) => w.id === id)?.name)
      .join(', ');

    const confirmed = confirm(
      `Are you sure you want to delete the following warehouse(s)?\n\n${warehouseNames}\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);

      // Delete warehouses one by one en el backend
      for (const id of selectedWarehouses) {
        const res = await fetch(`${API_BASE}/warehouses/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Error deleting warehouse ${id}:`, errorText);
          alert('Error deleting one or more warehouses. Please check the server logs.');
          // seguimos intentando con el resto
        }
      }

      // Filtrar localmente los warehouses eliminados
      const updatedWarehouses = warehouses.filter(
        (w) => !selectedWarehouses.includes(w.id)
      );
      onWarehousesUpdate(updatedWarehouses);
      setSelectedWarehouses([]);
      alert('Selected warehouses deleted successfully.');
    } catch (error) {
      console.error(error);
      alert('Network error while deleting warehouses.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCheckboxChange = (warehouseId: string, checked: boolean) => {
    setSelectedWarehouses((prev) =>
      checked ? [...prev, warehouseId] : prev.filter((id) => id !== warehouseId)
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Atras
            </Button>
          </div>
          <h1>Modificar Depositos</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-6">
            {/* Mode Selection */}
            <div>
              <Label className="mb-3 block">Seleccione opcion</Label>
              <RadioGroup
                value={mode}
                onValueChange={(value) => setMode(value as 'add' | 'remove')}
              >
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="add" id="mode-add" />
                    <Label htmlFor="mode-add" className="cursor-pointer">
                      Agregar Deposito
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="remove" id="mode-remove" />
                    <Label htmlFor="mode-remove" className="cursor-pointer">
                      Remover Deposito
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Add Warehouse Mode */}
            {mode === 'add' && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="warehouse-name">Nombre del Deposito</Label>
                  <Input
                    id="warehouse-name"
                    type="text"
                    placeholder="Ingrese el nombre del deposito"
                    value={newWarehouseName}
                    onChange={(e) => setNewWarehouseName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={handleAddWarehouse}
                  className="w-full"
                  size="lg"
                  disabled={isAdding}
                >
                  {isAdding ? 'Agregando...' : 'Agregar Deposito'}
                </Button>
              </div>
            )}

            {/* Remove Warehouse Mode */}
            {mode === 'remove' && (
              <div className="space-y-4 pt-4 border-t">
                <Label>Seleccione los depositos que quiere eliminar</Label>
                <Label>el/los mismos deben estar vacios</Label>
                {warehouses.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    No warehouses available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {warehouses.map((warehouse) => (
                      <div
                        key={warehouse.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50"
                      >
                        <Checkbox
                          id={`warehouse-${warehouse.id}`}
                          checked={selectedWarehouses.includes(warehouse.id)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(warehouse.id, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`warehouse-${warehouse.id}`}
                          className="cursor-pointer flex-1"
                        >
                          {warehouse.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  onClick={handleDeleteWarehouses}
                  className="w-full bg-red-600 hover:bg-red-700"
                  size="lg"
                  disabled={warehouses.length === 0 || isDeleting}
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar Depositos Seleccionados'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
