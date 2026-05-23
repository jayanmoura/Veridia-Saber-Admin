import { Search, SlidersHorizontal, X } from 'lucide-react';

interface FamilyOption {
  id: string;
  name: string;
}

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedFamily: string;
  onFamilyChange: (value: string) => void;
  families: FamilyOption[];
  placeholder?: string;
}

/**
 * SearchBar - Barra de busca e controle de filtros para o catálogo público
 */
export function SearchBar({
  searchTerm,
  onSearchChange,
  selectedFamily,
  onFamilyChange,
  families,
  placeholder = 'Buscar por nome popular ou científico...'
}: SearchBarProps) {
  const hasActiveFilters = searchTerm !== '' || selectedFamily !== '';

  const handleClearFilters = () => {
    onSearchChange('');
    onFamilyChange('');
  };

  const getFamilyName = (id: string) => {
    const family = families.find(f => f.id === id);
    return family ? family.name : id;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Container Principal */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        
        {/* Campo de Busca */}
        <div className="flex-1 relative flex items-center">
          <div className="absolute left-4 text-emerald-800/40 focus-within:text-emerald-500 transition-colors pointer-events-none">
            <Search className="w-5 h-5" strokeWidth={2} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-emerald-950/10 rounded-2xl text-emerald-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 p-1 text-stone-400 hover:text-emerald-600 hover:bg-stone-50 rounded-full transition-all"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtro por Família (Select Estilizado) */}
        <div className="relative flex items-center min-w-[200px] md:w-64">
          <div className="absolute left-4 text-emerald-800/40 pointer-events-none">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <select
            value={selectedFamily}
            onChange={(e) => onFamilyChange(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 bg-white border border-emerald-950/10 rounded-2xl text-emerald-950 appearance-none focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer shadow-xs font-medium text-sm"
          >
            <option value="">Todas as Famílias</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
          {/* Seta customizada do select */}
          <div className="absolute right-4 pointer-events-none flex items-center text-stone-400">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tags de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 animate-fade-in">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider mr-1">Filtros ativos:</span>
          
          {searchTerm && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-100">
              Busca: "{searchTerm}"
              <button onClick={() => onSearchChange('')} className="p-0.5 hover:bg-emerald-100 rounded-full transition-colors text-emerald-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedFamily && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 text-xs font-medium rounded-lg border border-purple-100">
              Família: {getFamilyName(selectedFamily)}
              <button onClick={() => onFamilyChange('')} className="p-0.5 hover:bg-purple-100 rounded-full transition-colors text-purple-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleClearFilters}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-500 underline decoration-2 underline-offset-4 ml-1 transition-colors"
          >
            Limpar todos
          </button>
        </div>
      )}
    </div>
  );
}
