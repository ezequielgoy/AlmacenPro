import { useEffect, useState } from 'react';
import { WarehouseSelector } from './components/WarehouseSelector';
import { InventoryList } from './components/InventoryList';
import { AddProducts } from './components/AddProducts';
import { Summary } from './components/Summary';
import { Confirmation } from './components/Confirmation';
import { ModifyWarehouse } from './components/ModifyWarehouse';
import { Reports } from './components/Reports';
import { Login } from './components/Login';
import { CreateProject } from './components/CreateProject';
import { CreateUser } from './components/CreateUser';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Search, Plus, Settings, FileText } from 'lucide-react';

const API_BASE = '/api';

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

interface User {
  id: string;
  username: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: number }>({});
  const [currentPage, setCurrentPage] = useState<
    | 'home'
    | 'add-products'
    | 'summary'
    | 'confirmation'
    | 'modify-warehouse'
    | 'reports'
    | 'create-project'
    | 'create-user'
  >('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmedChanges, setConfirmedChanges] = useState<{ [key: string]: number }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const mapWarehouse = (w: any): Warehouse => ({
    id: w._id ?? w.id,
    name: w.name,
  });

  const mapInventoryItem = (item: any): InventoryItem => ({
    id: item._id ?? item.id,
    name: item.name,
    currentStock: item.currentStock,
    warehouseId:
      typeof item.warehouse === 'string'
        ? item.warehouse
        : item.warehouse?._id ?? item.warehouseId,
  });

  const mapProject = (p: any): Project => ({
    id: p._id ?? p.id,
    name: p.name,
  });

  const loadInitialData = async (authToken: string) => {
    try {
      setIsLoading(true);
      setGlobalError(null);

      const [warehousesRes, inventoryRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/warehouses`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
        fetch(`${API_BASE}/inventory`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
        fetch(`${API_BASE}/projects`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
      ]);

      if (!warehousesRes.ok) throw new Error('Failed to load warehouses');
      if (!inventoryRes.ok) throw new Error('Failed to load inventory');
      if (!projectsRes.ok) throw new Error('Failed to load projects');

      const warehousesData = await warehousesRes.json();
      const inventoryData = await inventoryRes.json();
      const projectsData = await projectsRes.json();

      const mappedWarehouses = (warehousesData as any[]).map(mapWarehouse);
      const mappedInventory = (inventoryData as any[]).map(mapInventoryItem);
      const mappedProjects = (projectsData as any[]).map(mapProject);

      setWarehousesList(mappedWarehouses);
      setInventory(mappedInventory);
      setProjects(mappedProjects);

      if (!selectedWarehouse && mappedWarehouses.length > 0) {
        setSelectedWarehouse(mappedWarehouses[0].id);
      }
    } catch (error) {
      console.error(error);
      setGlobalError('Error loading data from server.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshInventory = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/inventory`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to load inventory');
      const data = await res.json();
      const mappedInventory = (data as any[]).map(mapInventoryItem);
      setInventory(mappedInventory);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (token) {
      loadInitialData(token);
    } else {
      setWarehousesList([]);
      setInventory([]);
      setProjects([]);
      setSelectedWarehouse('');
      setPendingChanges({});
      setConfirmedChanges({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredInventory = inventory.filter((item) => {
    const matchesWarehouse = selectedWarehouse ? item.warehouseId === selectedWarehouse : true;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWarehouse && matchesSearch;
  });

  const handleExtractionChange = (
    itemId: string,
    amount: number,
    maxStock: number
  ) => {
    setPendingChanges((prev) => {
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

  const handleConfirm = () => setCurrentPage('summary');

  const handleFinalConfirm = async (
    finalChanges: { [key: string]: number },
    meta: { requestedBy: string; project: string }
  ) => {
    if (!token || !selectedWarehouse) {
      alert('Missing authentication or warehouse selection');
      return;
    }

    try {
      const itemsPayload = Object.entries(finalChanges).map(([itemId, delta]) => ({
        itemId,
        delta,
      }));

      const res = await fetch(`${API_BASE}/movements/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          warehouseId: selectedWarehouse,
          items: itemsPayload,
          requestedBy: meta.requestedBy,
          project: meta.project,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error confirming changes:', errorText);
        alert('Error applying changes. Please try again.');
        return;
      }

      await res.json();
      setConfirmedChanges(finalChanges);
      setCurrentPage('confirmation');
      setPendingChanges({});
    } catch (error) {
      console.error(error);
      alert('Network error while applying changes.');
    }
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setConfirmedChanges({});
    refreshInventory();
  };

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (!data.token || !data.user) return false;

      setToken(data.token);
      setCurrentUser({
        id: data.user.id ?? data.user._id,
        username: data.user.username,
        role: data.user.role,
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setCurrentPage('home');
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  if (!currentUser) return <Login onLogin={handleLogin} />;

  if (currentPage === 'add-products')
    return (
      <AddProducts
        warehouses={warehousesList}
        token={token as string}
        onBack={() => {
          setCurrentPage('home');
          refreshInventory();
        }}
      />
    );

  if (currentPage === 'summary')
    return (
      <Summary
        warehouses={warehousesList}
        inventory={inventory}
        pendingChanges={pendingChanges}
        onPendingChangesUpdate={setPendingChanges}
        onConfirm={handleFinalConfirm}
        onBack={() => setCurrentPage('home')}
        projects={projects}
      />
    );

  if (currentPage === 'confirmation')
    return (
      <Confirmation
        warehouses={warehousesList}
        inventory={inventory}
        confirmedChanges={confirmedChanges}
        onBackToHome={handleBackToHome}
      />
    );

  if (currentPage === 'modify-warehouse')
    return (
      <ModifyWarehouse
        warehouses={warehousesList}
        token={token as string}
        onWarehousesUpdate={setWarehousesList}
        onBack={() => setCurrentPage('home')}
      />
    );

  if (currentPage === 'reports')
    return (
      <Reports
        warehouses={warehousesList}
        token={token as string}
        onBack={() => setCurrentPage('home')}
        projects={projects}
      />
    );

  if (currentPage === 'create-project')
    return (
      <CreateProject
        token={token as string}
        onBack={() => setCurrentPage('home')}
        onProjectCreated={(project) =>
          setProjects((prev) =>
            [...prev, project].sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          )
        }
      />
    );

  if (currentPage === 'create-user')
    return (
      <CreateUser
        token={token as string}
        currentUserRole={currentUser.role}
        onBack={() => setCurrentPage('home')}
      />
    );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">AP</span>
            </div>
            <div>
              <h1 className="leading-tight">AlmacenPro</h1>
              <p className="text-sm text-slate-500">Control de inventario en multiples depositos</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage('create-user')}
                className="text-slate-700 border-slate-200"
              >
                Crear Usuario
              </Button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Conectado como:</span>
              <span className="text-sm font-medium text-slate-900">
                {currentUser.username} ({currentUser.role})
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-slate-700 border-slate-200"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6 flex-1">
        <div className="w-full lg:w-80 space-y-6">

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-sm font-semibold text-slate-900"></h2>
              <p className="text-xs text-slate-500 mt-1">
                Maneja tu base de datos y reportes.
              </p>
            </div>
            <div className="p-4 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setCurrentPage('create-project')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Crear Proyecto
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setCurrentPage('add-products')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Productos
              </Button>

              {currentUser.role === 'admin' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setCurrentPage('modify-warehouse')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Modificar Depositos
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setCurrentPage('reports')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Reportes de Movimientos
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h2 className="text-sm font-semibold text-slate-900">Depositos</h2>
            </div>
            <div className="p-4">
              <WarehouseSelector
                warehouses={warehousesList}
                selectedWarehouse={selectedWarehouse}
                onWarehouseChange={setSelectedWarehouse}
              />
            </div>
        </div>


        <div className="flex-1 container mx-auto px-0 py-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto bg-white rounded-lg shadow-sm border flex flex-col">
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar Producto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {globalError && (
                <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
                  {globalError}
                </div>
              )}
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  Cargando inventario...
                </div>
              ) : (
                <InventoryList
                  items={filteredInventory}
                  pendingChanges={pendingChanges}
                  onExtractionChange={handleExtractionChange}
                  canDelete={currentUser.role === 'admin'}
                  onDeleteItem={async (itemId) => {
                    if (!token) return;
                    const confirmDelete = confirm(
                      'Estas seguro que queres eliminar este producto?'
                    );
                    if (!confirmDelete) return;

                    try {
                      const res = await fetch(`/api/inventory/${itemId}`, {
                        method: 'DELETE',
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      });

                      if (res.status === 204) {
                        setInventory((prev) => prev.filter((i) => i.id !== itemId));
                        setPendingChanges((prev) => {
                          const { [itemId]: _, ...rest } = prev;
                          return rest;
                        });
                      } else {
                        const text = await res.text();
                        console.error('Error deleting item:', text);
                        alert('Failed to delete product.');
                      }
                    } catch (err) {
                      console.error(err);
                      alert('Network error while deleting product.');
                    }
                  }}
                />
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t bg-white rounded-lg shadow-lg p-4">
            <Button
              onClick={handleConfirm}
              className="w-full"
              size="lg"
              disabled={!hasPendingChanges}
            >
              {hasPendingChanges ? 'Confirmar Retiro' : 'Retirar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
