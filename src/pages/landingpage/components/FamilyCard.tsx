export interface FamilyItem {
  id: string;
  name: string;
  url_image: string | null;
  species_count: number;
  description: string | null;
}

interface FamilyCardProps {
  family: FamilyItem;
  onClick?: () => void;
}

export function FamilyCard({ family, onClick }: FamilyCardProps) {
  const { name, url_image, species_count, description } = family;

  // Limita a descrição a 100 caracteres
  const getShortDesc = (text: string | null) => {
    if (!text) return '';
    const cleanText = text.replace(/<[^>]*>/g, ''); // Remove tags HTML
    if (cleanText.length <= 100) return cleanText;
    return cleanText.substring(0, 100) + '...';
  };

  const shortDesc = getShortDesc(description);

  return (
    <div
      onClick={onClick}
      className="group flex flex-col bg-white rounded-2xl border border-[#dde8d5] shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-300 overflow-hidden h-full text-left cursor-pointer"
    >
      {/* Imagem/Fallback */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f0f5ee]">
        {url_image ? (
          <img
            src={url_image}
            alt={`Família ${name}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#4a7c5a]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
              <path d="M12 2C6 2 2 8 2 12c0 5.5 4.5 9 10 9s10-3.5 10-9C22 8 18 2 12 2z"/>
              <path d="M12 2v19M2 12h20"/>
            </svg>
          </div>
        )}

        {/* Badge de contador de espécies */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#5fcf6e]/15 text-[#4a7c5a]">
            {species_count} {species_count === 1 ? 'espécie' : 'espécies'}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#1a3a1f] group-hover:text-emerald-700 transition-colors">
            {name}
          </h3>
          {shortDesc && (
            <p className="text-xs text-stone-500 mt-2 leading-relaxed font-normal">
              {shortDesc}
            </p>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-[#dde8d5] flex items-center justify-between text-[#5fcf6e] font-semibold text-xs">
          <span>Ver espécies</span>
          <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </div>
  );
}
