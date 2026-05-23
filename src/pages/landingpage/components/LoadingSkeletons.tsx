/**
 * SpeciesCardSkeleton - Esqueleto de carregamento animado para SpeciesCard
 */
export function SpeciesCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-emerald-950/[0.06] shadow-xs overflow-hidden">
      {/* Imagem Placeholder */}
      <div className="relative aspect-[4/3] w-full bg-stone-100 animate-pulse flex items-center justify-center">
        {/* Badge Placeholder */}
        <div className="absolute top-3 left-3 w-16 h-5 bg-stone-200 rounded-full"></div>
        {/* Ícone sutil no meio do pulso */}
        <div className="w-10 h-10 rounded-full bg-stone-200/50"></div>
      </div>

      {/* Detalhes Placeholder */}
      <div className="flex flex-col flex-1 p-4 lg:p-5 space-y-3">
        {/* Nome popular */}
        <div className="h-5 w-3/4 bg-stone-200 rounded-md animate-pulse"></div>

        {/* Nome científico */}
        <div className="h-4 w-1/2 bg-stone-100 rounded-md animate-pulse"></div>

        {/* Linha decorativa */}
        <div className="pt-4 border-t border-emerald-950/[0.04]">
          <div className="h-3 w-20 bg-stone-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * FamilyCardSkeleton - Esqueleto de carregamento animado para FamilyCard
 */
export function FamilyCardSkeleton() {
  return (
    <div className="relative aspect-square w-full rounded-2xl border border-emerald-950/[0.06] overflow-hidden bg-stone-100 animate-pulse">
      {/* Detalhes flutuantes no esqueleto */}
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <div className="h-4 w-1/3 bg-stone-200/80 rounded-md"></div>
        <div className="h-6 w-3/4 bg-stone-200 rounded-md"></div>
      </div>
    </div>
  );
}
