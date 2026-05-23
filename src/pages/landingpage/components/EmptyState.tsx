import { Leaf, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onClearFilters?: () => void;
}

/**
 * EmptyState - Estado vazio elegante para filtros ou buscas sem resultados no catálogo público
 */
export function EmptyState({
  title = 'Nenhuma planta encontrada',
  description = 'Não encontramos resultados para os termos ou filtros aplicados. Tente ajustar os filtros ou realizar uma nova busca.',
  onClearFilters
}: EmptyStateProps) {
  return (
    <div className="w-full max-w-md mx-auto py-16 px-6 text-center flex flex-col items-center">
      {/* Ilustração ou Ícone com círculos concêntricos e gradientes */}
      <div className="relative w-32 h-32 flex items-center justify-center mb-6">
        {/* Círculo de fundo pulsante */}
        <div className="absolute inset-0 bg-emerald-500/5 rounded-full scale-100 animate-pulse"></div>
        {/* Círculo secundário com blur */}
        <div className="absolute w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-purple-500/10 rounded-full blur-xs"></div>
        {/* Círculo central do ícone */}
        <div className="relative w-16 h-16 bg-white border border-emerald-950/[0.06] rounded-2xl flex items-center justify-center shadow-md">
          <Leaf className="w-8 h-8 text-emerald-600 stroke-[1.25]" />
        </div>
      </div>

      {/* Título */}
      <h3 className="text-xl lg:text-2xl font-serif font-bold text-emerald-950 mb-3 leading-tight">
        {title}
      </h3>

      {/* Descrição */}
      <p className="text-sm text-stone-500 leading-relaxed mb-8">
        {description}
      </p>

      {/* Botão de Redefinição */}
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/15 hover:shadow-emerald-900/25 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500" />
          <span>Limpar todos os filtros</span>
        </button>
      )}
    </div>
  );
}
