import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { ArrowLeft } from 'lucide-react';

const API_BASE = '/api';

interface Warehouse {
  id: string;
  name: string;
}

interface AddProductsProps {
  warehouses: Warehouse[];
  token: string;
  onBack: () => void;
}

export function AddProducts({ warehouses, token, onBack }: AddProductsProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(warehouses[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddProduct = async () => {
    if (!description.trim() || !quantity.trim()) {
      alert('LLene todos los campos por favor');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Ingrese una cantidad valida');
      return;
    }

    if (!selectedWarehouse) {
      alert('Elija un deposito por favor');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${API_BASE}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: description,
          currentStock: qty,
          warehouseId: selectedWarehouse,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error al agregar productos:', errorText);
        alert('Error al agregar producto.');
        return;
      }

      const warehouseName = warehouses.find((w) => w.id === selectedWarehouse)?.name;

      alert(
        `Se Agrego correctamente el producto\n\nDeposito: ${warehouseName}\Nombre: ${description}\nCantidad: ${qty}`
      );

      // Reset form
      setDescription('');
      setQuantity('');
    } catch (error) {
      console.error(error);
      alert('Error de red al intentar agregar el producto.');
    } finally {
      setIsSubmitting(false);
    }
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
          <h1>Agregar Producto</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-6">
            {/* Warehouse Selection */}
            <div>
              <Label className="mb-3 block">Elegi un Deposito</Label>
              <RadioGroup value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <div className="flex flex-col gap-3">
                  {warehouses.map((warehouse) => (
                    <label
                      key={warehouse.id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50"
                    >
                      <RadioGroupItem
                        value={warehouse.id}
                        id={`warehouse-${warehouse.id}`}
                      />
                      <span className="font-medium text-slate-900">{warehouse.name}</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Product Description */}
            <div>
              <Label htmlFor="description">Nombre del Producto</Label>
              <Input
                id="description"
                placeholder="Ingrese el nombre del producto"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Quantity Input */}
            <div>
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Ingrese la cantidad"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="mt-2"
              />
            </div>

            {/* Add Product Button */}
            <Button
              onClick={handleAddProduct}
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Agregando...' : 'Agregar producto'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
