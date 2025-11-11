import { useEffect, useMemo, useState } from 'react';
import { Input } from './ui/input';
import { ChevronDown } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface ProjectSelectProps {
  projects: Project[];
  selectedProjectId: string;
  onChange: (projectId: string) => void;
  placeholder?: string;
}

export function ProjectSelect({
  projects,
  selectedProjectId,
  onChange,
  placeholder = 'Select project',
}: ProjectSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const selected = projects.find((p) => p.id === selectedProjectId);
    if (selected) {
      setSearchValue(selected.name);
    } else {
      setSearchValue('');
    }
  }, [selectedProjectId, projects]);

  const filteredProjects = useMemo(() => {
    const term = searchValue.toLowerCase();
    if (!term) return projects;
    return projects.filter((p) =>
      p.name.toLowerCase().startsWith(term)
    );
  }, [projects, searchValue]);

  const handleInputChange = (value: string) => {
    setSearchValue(value);
    setIsOpen(true);

    if (value === '') {
      // limpiar selección si borran el texto
      onChange('');
    }
  };

  const handleSelect = (projectId: string, name: string) => {
    onChange(projectId);
    setSearchValue(name);
    setIsOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative">
      <div
        className="flex items-center gap-1 cursor-text"
        onClick={() => setIsOpen(true)}
      >
        <Input
          value={searchValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
        />
        <ChevronDown className="h-4 w-4 text-slate-500 -ml-7 pointer-events-none" />
      </div>

      {isOpen && filteredProjects.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto">
          {filteredProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(project.id, project.name)}
            >
              {project.name}
            </button>
          ))}
        </div>
      )}

      {isOpen && filteredProjects.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-lg p-2 text-xs text-slate-500">
          No se encontrar proyectos
        </div>
      )}
    </div>
  );
}
