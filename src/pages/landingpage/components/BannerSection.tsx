import { useNavigate } from 'react-router-dom';

export function BannerSection() {
  const navigate = useNavigate();

  const handleExplorar = () => {
    navigate('/catalogo');
  };

  return (
    <section className="py-12 px-6 bg-forest-50">
      <div className="container mx-auto max-w-6xl">
          <div className="bg-white rounded-2xl border border-forest-200 p-6 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-l-4 border-l-forest-400 text-left">
          
          {/* Info */}
          <div className="space-y-3 max-w-2xl">
            <span className="text-forest-600 text-xs font-bold uppercase tracking-widest block">
              PARCEIRO INSTITUCIONAL
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-forest-900 leading-tight">
              Jardim Botânico da UFRRJ — Acervo Digital Disponível
            </h3>
            <p className="text-sm text-forest-600 leading-relaxed">
              Explore espécimes georreferenciados, fotografias em alta resolução e fichas taxonômicas completas do campus da Universidade Federal Rural do Rio de Janeiro.
            </p>
          </div>

          {/* Action */}
          <div className="flex-shrink-0">
            <button
              onClick={handleExplorar}
              className="px-6 py-3 border border-forest-900 text-forest-900 hover:bg-forest-900/5 font-semibold rounded-full transition-all duration-300 active:scale-95 cursor-pointer text-sm"
            >
              Explorar →
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
