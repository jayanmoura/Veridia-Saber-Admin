import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export function StatsBar() {
  const [stats, setStats] = useState({ especies: 0, familias: 0, imagens: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [espRes, famRes, imgRes] = await Promise.all([
          supabase.from('especie').select('id', { count: 'exact', head: true }),
          supabase.from('familia').select('id', { count: 'exact', head: true }),
          supabase.from('imagens').select('id', { count: 'exact', head: true })
        ]);

        if (espRes.error) throw espRes.error;
        if (famRes.error) throw famRes.error;
        if (imgRes.error) throw imgRes.error;

        setStats({
          especies: espRes.count || 0,
          familias: famRes.count || 0,
          imagens: imgRes.count || 0
        });
      } catch (err) {
        console.error('Erro ao buscar counts para o StatsBar:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();
  }, []);

  return (
    <section className="bg-[#1a3a1f] text-white py-12 px-6 relative z-10 shadow-md">
      <div className="container mx-auto max-w-4xl">
        <div className="grid grid-cols-3 divide-x divide-white/10 items-center text-center">
          
          {/* Espécies */}
          <div className="px-2 space-y-1">
            {loading ? (
              <div className="h-10 w-24 bg-white/10 rounded-lg mx-auto animate-pulse"></div>
            ) : (
              <div className="text-3xl md:text-4xl font-bold text-[#5fcf6e]">
                {stats.especies.toLocaleString('pt-BR')}
              </div>
            )}
            <div className="text-xs uppercase tracking-widest text-[#a0c8a8] font-semibold">
              Espécies
            </div>
          </div>

          {/* Famílias */}
          <div className="px-2 space-y-1">
            {loading ? (
              <div className="h-10 w-24 bg-white/10 rounded-lg mx-auto animate-pulse"></div>
            ) : (
              <div className="text-3xl md:text-4xl font-bold text-[#5fcf6e]">
                {stats.familias.toLocaleString('pt-BR')}
              </div>
            )}
            <div className="text-xs uppercase tracking-widest text-[#a0c8a8] font-semibold">
              Famílias
            </div>
          </div>

          {/* Imagens */}
          <div className="px-2 space-y-1">
            {loading ? (
              <div className="h-10 w-24 bg-white/10 rounded-lg mx-auto animate-pulse"></div>
            ) : (
              <div className="text-3xl md:text-4xl font-bold text-[#5fcf6e]">
                {stats.imagens.toLocaleString('pt-BR')}
              </div>
            )}
            <div className="text-xs uppercase tracking-widest text-[#a0c8a8] font-semibold">
              Imagens
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
