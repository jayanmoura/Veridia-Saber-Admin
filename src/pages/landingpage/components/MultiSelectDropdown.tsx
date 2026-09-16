import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  sublabel?: string | null;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  itemNounSingular?: string;
  itemNounPlural?: string;
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder = 'Todas as espécies',
  className = '',
  itemNounSingular = 'espécie',
  itemNounPlural = 'espécies',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filtra as opções pelo termo digitado na busca interna
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(
      opt =>
        opt.label.toLowerCase().includes(term) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(term))
    );
  }, [options, searchTerm]);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    onChange(options.map(o => o.value));
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange([]);
  };

  // Texto descritivo para o botão acionador
  const getTriggerLabel = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (selectedValues.length === 1) {
      const found = options.find(o => o.value === selectedValues[0]);
      return found ? found.label : `1 ${itemNounSingular} selecionada`;
    }
    return `${selectedValues.length} ${itemNounPlural} selecionadas`;
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left w-full sm:w-72 ${className}`}>
      {/* Botão de disparo do Dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-white border border-forest-200 rounded-xl text-sm font-medium text-forest-900 shadow-xs hover:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-400/20 transition-all cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`truncate text-left ${selectedValues.length === 1 ? 'italic' : ''} ${selectedValues.length === 0 ? 'text-neutral-500 font-normal' : 'text-forest-900 font-semibold'}`}>
          {getTriggerLabel()}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0 text-forest-600">
          {selectedValues.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClearAll}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClearAll();
                }
              }}
              className="p-0.5 hover:bg-forest-100 rounded-full text-neutral-400 hover:text-forest-800 transition-colors"
              title="Limpar seleção"
              aria-label="Limpar seleção"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-forest-800' : 'text-forest-400'}`}
          />
        </div>
      </button>

      {/* Painel do Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-full sm:w-80 bg-white rounded-xl shadow-lg border border-forest-200 z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100">
          {/* Campo de busca rápida interno */}
          <div className="p-2.5 border-b border-forest-100 bg-forest-50/50">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-forest-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={`Buscar ${itemNounSingular}...`}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-forest-200 rounded-lg text-forest-900 placeholder-neutral-400 focus:outline-none focus:border-forest-400 transition-colors"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 text-neutral-400 hover:text-neutral-600 cursor-pointer p-0.5"
                  aria-label="Limpar busca"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Barra de ações rápidas */}
          <div className="px-3 py-2 bg-forest-50/40 border-b border-forest-100 flex items-center justify-between text-xs text-forest-600 font-medium">
            <button
              type="button"
              onClick={handleSelectAll}
              className="hover:text-forest-900 transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              Selecionar todas ({options.length})
            </button>
            {selectedValues.length > 0 && (
              <button
                type="button"
                onClick={() => handleClearAll()}
                className="hover:text-forest-900 transition-colors cursor-pointer bg-transparent border-none p-0 text-neutral-500"
              >
                Limpar seleção
              </button>
            )}
          </div>

          {/* Lista de opções com checkbox */}
          <div className="max-h-60 overflow-y-auto divide-y divide-forest-50 p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-400 italic">
                Nenhuma {itemNounSingular} encontrada.
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-forest-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                        isSelected
                          ? 'bg-forest-600 border-forest-600 text-white'
                          : 'border-forest-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold italic text-forest-900 truncate block">
                        {option.label}
                      </span>
                      {option.sublabel && (
                        <span className="text-[11px] text-neutral-500 truncate block capitalize font-normal">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
