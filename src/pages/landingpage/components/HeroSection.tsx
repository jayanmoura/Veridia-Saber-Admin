import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export function HeroSection() {
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [stats, setStats] = useState({ especies: 0, familias: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [espRes, famRes] = await Promise.all([
          supabase.from('especie').select('id', { count: 'exact', head: true }),
          supabase.from('familia').select('id', { count: 'exact', head: true })
        ]);

        if (espRes.error) throw espRes.error;
        if (famRes.error) throw famRes.error;

        setStats({
          especies: espRes.count || 0,
          familias: famRes.count || 0
        });
      } catch (err) {
        console.error('Erro ao buscar estatísticas do acervo botânico:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const handleScrollToCTA = () => {
    const ctaSec = document.getElementById('app-cta');
    ctaSec?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative w-full min-h-[70vh] flex items-center justify-center pt-20 pb-12 px-6 overflow-hidden text-center"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1502810365585-56ffa361fdde?w=1600&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay escuro semitransparente */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(13,36,16,0.72) 0%, rgba(13,36,16,0.85) 100%)'
        }}
      />

      <div className="relative z-10 container mx-auto max-w-4xl flex flex-col items-center justify-center space-y-6">

        {/* Tag Superior */}
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-forest-400 font-bold block">
            PORTAL BOTÂNICO · veridiasaber.com.br
          </span>
        </div>

        {/* Título Principal */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
          <span className="text-white block">Veridia Saber:</span>
          <span className="text-forest-400 block mt-2">Sua enciclopédia botânica de bolso.</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-forest-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Catálogo científico de espécies e famílias botânicas.
        </p>

        {/* Barra de Busca (Estilo GBIF) */}
        <div className="max-w-2xl w-full mx-auto mt-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <Search className="absolute left-5 text-forest-600 w-5 h-5 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nome científico, popular ou família..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-white text-stone-800 placeholder-stone-400 rounded-full pl-12 pr-36 py-4.5 shadow-2xl border border-white/10 text-base focus:outline-hidden focus:ring-2 focus:ring-forest-400/50 focus:border-forest-400 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-forest-900 hover:bg-forest-800 text-white font-bold rounded-full px-6 py-3 text-sm transition-all shadow-md cursor-pointer hover:scale-102 active:scale-98"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Seção de Contadores/Stats integrados */}
        <div className="flex gap-8 items-center justify-center mt-6">

          {/* Espécies (Registros de Dados) */}
          <div className="text-center min-w-[140px]">
            {loading ? (
              <div className="h-8 w-24 bg-white/10 rounded-lg mx-auto animate-pulse mb-2"></div>
            ) : (
              <div className="text-white font-bold text-2xl md:text-3xl">
                {stats.especies.toLocaleString('pt-BR')}
              </div>
            )}
            <div className="text-forest-400 text-xs uppercase tracking-widest font-semibold mt-1">
              Registros de Dados
            </div>
          </div>

          {/* Divisória Vertical */}
          <div className="w-px h-10 bg-white/20"></div>

          {/* Famílias (Conjuntos de Dados) */}
          <div className="text-center min-w-[140px]">
            {loading ? (
              <div className="h-8 w-24 bg-white/10 rounded-lg mx-auto animate-pulse mb-2"></div>
            ) : (
              <div className="text-white font-bold text-2xl md:text-3xl">
                {stats.familias.toLocaleString('pt-BR')}
              </div>
            )}
            <div className="text-forest-400 text-xs uppercase tracking-widest font-semibold mt-1">
              Conjuntos de Dados
            </div>
          </div>

        </div>

        {/* Botões Secundários de Ação */}
        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <button
            onClick={() => navigate('/catalogo')}
            className="px-8 py-3 bg-forest-400 hover:bg-forest-600 text-forest-950 font-bold rounded-full transition-all duration-300 shadow-md cursor-pointer hover:scale-102 active:scale-98 text-sm"
          >
            Ver Catálogo
          </button>
          <button
            onClick={handleScrollToCTA}
            className="px-8 py-3 border border-white/40 text-white hover:bg-white/10 font-bold rounded-full transition-all duration-300 active:scale-98 cursor-pointer text-sm"
          >
            Baixar App
          </button>
        </div>

      </div>

      {/* Crédito da Foto */}
      <span className="absolute bottom-4 right-6 text-xs text-white/40 pointer-events-none select-none">
        Foto: Unsplash / Natureza brasileira
      </span>
    </section>
  );
}
