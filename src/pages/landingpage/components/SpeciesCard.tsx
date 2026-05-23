import { Link } from 'react-router-dom';

export interface SpeciesItem {
  id: string;
  name_scientific: string;
  name_popular: string | null;
  family_name: string;
  url_micro: string | null;
}

interface SpeciesCardProps {
  species: SpeciesItem;
}

export function SpeciesCard({ species }: SpeciesCardProps) {
  const { id, name_scientific, name_popular, family_name, url_micro } = species;

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-[#dde8d5] shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-300 overflow-hidden h-full text-left">
      {/* Top Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#2d5a3d]/10">
        {url_micro ? (
          <img
            src={url_micro}
            alt={name_popular || name_scientific}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#2d5a3d] text-white">
            <span className="text-3xl" role="img" aria-label="Planta">🌿</span>
          </div>
        )}

        {/* Family Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#5fcf6e]/15 text-[#4a7c5a]">
            {family_name}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div className="space-y-1.5">
          {/* Nome Científico */}
          <h3 className="text-base font-semibold italic text-[#1a3a1f] leading-snug">
            {name_scientific}
          </h3>

          {/* Nome Popular */}
          <p className="text-sm text-[#4a7c5a] font-medium capitalize">
            {name_popular || 'Nome popular não registrado'}
          </p>
        </div>

        {/* Rodapé do Card */}
        <div className="pt-4 mt-6 border-t border-[#dde8d5] flex items-center justify-between">
          <Link
            to={`/catalogo/especie/${id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#5fcf6e] hover:text-[#4eb85c] transition-colors"
          >
            <span>Ver detalhes</span>
            <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
