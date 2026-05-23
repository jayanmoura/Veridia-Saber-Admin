import { Link } from 'react-router-dom';

export interface FamilyChipItem {
  id: string;
  name: string;
  description: string | null;
}

interface FamilyChipProps {
  family: FamilyChipItem;
}

export function FamilyChip({ family }: FamilyChipProps) {
  const { id, name, description } = family;

  // Trata e limita a descrição aos primeiros 60 caracteres
  const getShortDesc = (text: string | null) => {
    if (!text) return '';
    const cleanText = text.replace(/<[^>]*>/g, ''); // Remove tags HTML se houver
    if (cleanText.length <= 60) return cleanText;
    return cleanText.substring(0, 60) + '...';
  };

  const shortDesc = getShortDesc(description);

  return (
    <Link
      to={`/familias-catalogo/${id}`}
      className="flex items-center gap-3 bg-white border border-[#dde8d5] hover:border-[#5fcf6e] p-4 rounded-2xl transition-all duration-300 hover:bg-white hover:shadow-xs group text-left"
    >
      {/* Ícone de Folha SVG único */}
      <div className="w-10 h-10 rounded-xl bg-[#f8faf6] group-hover:bg-[#5fcf6e]/10 flex items-center justify-center transition-colors flex-shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#4a7c5a] w-6 h-6">
          <path d="M12 2C6 2 2 8 2 12c0 5.5 4.5 9 10 9s10-3.5 10-9C22 8 18 2 12 2z"/>
          <path d="M12 2v19M2 12h20"/>
        </svg>
      </div>

      {/* Info */}
      <div className="min-w-0">
        <h4 className="text-sm font-medium text-[#1a3a1f] truncate">
          {name}
        </h4>
        {shortDesc && (
          <p className="text-[11px] text-[#4a7c5a] truncate mt-0.5 font-normal">
            {shortDesc}
          </p>
        )}
      </div>
    </Link>
  );
}
