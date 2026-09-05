import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { SpeciesCard } from './SpeciesCard';
import type { SpeciesItem } from './SpeciesCard';
import { SkeletonCard } from './SkeletonCard';

interface RawFeaturedSpeciesRow {
  id: string;
  nome_cientifico: string;
  nome_popular: string | null;
  url_micro: string | null;
  url_thumbnail: string | null;
  familia: { familia_nome: string } | { familia_nome: string }[] | null;
}

export function SpeciesSection() {
  const [species, setSpecies] = useState<SpeciesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedSpecies() {
      try {
        const { data, error } = await supabase
          .from('especie')
          .select(`
            id,
            nome_cientifico,
            nome_popular,
            url_micro,
            url_thumbnail,
            familia (
              familia_nome
            )
          `)
          .order('nome_cientifico')
          .limit(4);

        if (error) throw error;

        const formatted: SpeciesItem[] = ((data || []) as RawFeaturedSpeciesRow[]).map((item) => {
          // Trata o objeto de familia retornado como objeto único ou array
          const famObj = Array.isArray(item.familia) ? item.familia[0] : item.familia;
          return {
            id: item.id,
            name_scientific: item.nome_cientifico,
            name_popular: item.nome_popular,
            family_name: famObj?.familia_nome || 'Desconhecida',
            url_micro: item.url_micro || item.url_thumbnail || null
          };
        });

        setSpecies(formatted);
      } catch (err) {
        console.error('Erro ao carregar espécies em destaque:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedSpecies();
  }, []);

  const placeholdersNeeded = Math.max(0, 4 - species.length);

  return (
    <section className="py-20 px-6 bg-white text-stone-800">
      <div className="container mx-auto max-w-6xl space-y-10">
        
        {/* Section Header */}
        <div className="flex items-end justify-between pb-4 border-b border-forest-200">
          <div className="text-left">
            <span className="text-forest-600 text-xs font-bold uppercase tracking-widest block mb-2">O QUE É O VERIDIA SABER</span>
            <h2 className="text-2xl md:text-3xl font-bold text-forest-900">
              Espécies em Destaque
            </h2>
          </div>
          <Link
            to="/catalogo"
            className="flex items-center gap-1 text-sm font-bold text-forest-400 hover:text-forest-600 transition-colors"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {species.map((item) => (
              <SpeciesCard key={item.id} species={item} />
            ))}

            {/* Traced Placeholders */}
            {placeholdersNeeded > 0 && 
              Array.from({ length: placeholdersNeeded }).map((_, idx) => (
                <div 
                  key={`placeholder-${idx}`} 
                  className="flex flex-col items-center justify-center border-2 border-dashed border-forest-200 rounded-2xl p-6 bg-transparent h-full min-h-[350px] text-center text-forest-600/60"
                >
                  <span className="text-3xl mb-2" role="img" aria-label="Planta">🌱</span>
                  <p className="text-sm font-bold text-forest-900">Mais espécies em breve</p>
                  <p className="text-xs text-forest-600/70 mt-1">Coleção sob constante catalogação de campo.</p>
                </div>
              ))
            }
          </div>
        )}

      </div>
    </section>
  );
}
