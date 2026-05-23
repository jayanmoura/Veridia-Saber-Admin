export function SkeletonCard() {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-emerald-950/[0.04] shadow-xs overflow-hidden h-[360px] animate-pulse">
      {/* Imagem */}
      <div className="relative aspect-[4/3] w-full bg-stone-200"></div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-5 space-y-4">
        {/* Family Badge */}
        <div className="h-4 w-20 bg-stone-150 rounded-full"></div>
        {/* Popular Name */}
        <div className="h-5 w-3/4 bg-stone-200 rounded-md"></div>
        {/* Scientific Name */}
        <div className="h-4.5 w-1/2 bg-stone-150 rounded-md"></div>
        
        <div className="pt-4 border-t border-stone-100 flex justify-between items-center flex-grow">
          {/* Local Name */}
          <div className="h-4 w-28 bg-stone-150 rounded-md"></div>
          {/* Button Link */}
          <div className="h-4 w-16 bg-stone-200 rounded-md"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonChip() {
  return (
    <div className="flex items-center gap-3 bg-white border border-stone-200/60 p-4 rounded-2xl h-16 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-stone-200 flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-stone-200 rounded-md w-2/3"></div>
        <div className="h-3 bg-stone-150 rounded-md w-1/2"></div>
      </div>
    </div>
  );
}
