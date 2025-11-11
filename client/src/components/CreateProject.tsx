import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowLeft, PlusCircle } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface CreateProjectProps {
  token: string;
  onBack: () => void;
  onProjectCreated: (project: Project) => void;
}

const API_BASE = '/api';

export function CreateProject({
  token,
  onBack,
  onProjectCreated,
}: CreateProjectProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    setError(null);
    setSuccess(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Se requiere nombre de Proyecto.');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Error al crear el proyecto:', text);
        setError('No se pudo crear el proyecto. Puede que ya exista.');
        return;
      }

      const data = await res.json();
      const project: Project = {
        id: data._id ?? data.id,
        name: data.name,
      };

      onProjectCreated(project);
      setSuccess('Se creo el proyecto.');
      setName('');
    } catch (err) {
      console.error(err);
      setError('Error de red al intentar crear el proyecto.');
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
          <h1>Crear Proyecto</h1>
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
              htmlFor="projectName"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Project name
            </label>
            <Input
              id="projectName"
              placeholder="Ingrese el nombre del proyecto"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <Button
              onClick={handleCreate}
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
