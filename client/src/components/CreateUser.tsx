import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowLeft, UserPlus } from 'lucide-react';

const API_BASE = '/api';

interface CreateUserProps {
  token: string;
  currentUserRole: string; // "admin" | "manager" | "user"
  onBack: () => void;
}

export function CreateUser({
  token,
  currentUserRole,
  onBack,
}: CreateUserProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // rol que se va a mandar al backend
  const [role, setRole] = useState<'user' | 'manager'>('user');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentUserRole === 'admin';
  const isManager = currentUserRole === 'manager';

  // Si es manager, forzamos rol "user" y no mostramos dropdown
  useEffect(() => {
    if (isManager && !isAdmin) {
      setRole('user');
    }
  }, [isManager, isAdmin]);

  const handleCreateUser = async () => {
    setError(null);
    setSuccess(null);

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setError('Username y password requerido .');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password,
          role, // el backend igual aplicará reglas según el rol del usuario logueado
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Error creating user:', text);
        setError('Failed to create user. Username may already exist.');
        return;
      }

      await res.json();
      setSuccess('User created successfully.');
      setUsername('');
      setPassword('');
      if (isAdmin) {
        setRole('user');
      }
    } catch (err) {
      console.error(err);
      setError('Network error while creating user.');
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
          <h1>Crear usuario para darle acceso al sistema.</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex-1 flex items-start">
        <div className="bg-white rounded-lg shadow-sm border p-6 w-full max-w-lg space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-md p-3">
              {success}
            </div>
          )}

          <div>
            <label
              htmlFor="username"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Usuario
            </label>
            <Input
              id="username"
              placeholder="Ingrese el username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Constraseña
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Ingrese la contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Dropdown de rol: solo visible para admin */}
          {isAdmin && (
            <div>
              <label
                htmlFor="role"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Rol
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value === 'manager' ? 'manager' : 'user')
                }
                className="border border-slate-300 rounded-md px-3 py-2 text-sm w-full bg-white"
              >
                <option value="user">user</option>
                <option value="manager">manager</option>
              </select>
            </div>
          )}

          {isManager && !isAdmin && (
            <p className="text-xs text-slate-500">
              Como es un manager crea usuarios con el rol <b>user</b> por defecto.
            </p>
          )}

          <div className="pt-2">
            <Button
              onClick={handleCreateUser}
              disabled={isSubmitting}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
