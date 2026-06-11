import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FamilyCard } from './components/FamilyCard';
import type { FamilyItem } from './components/FamilyCard';
import { FamilyCardSkeleton } from './components/LoadingSkeletons';

export default function CatalogoFamilias() {
  const navigate = useNavigate();
  const [families, setFamilies] = useState<FamilyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter States
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Debounce for search (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(inputValue);
      setPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [inputValue]);

  const loadFamilies = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('familia')
        .select('id, familia_nome, descricao_familia, imagem_micro, imagem_thumbnail, imagem_referencia, especie(count)', { count: 'exact' })
        .or('imagem_referencia.not.is.null,descricao_familia.not.is.null');

      if (search.trim()) {
        query = query.ilike('familia_nome', `%${search.trim()}%`);
      }

      query = query.order('familia_nome', { ascending: true }).range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const formattedData: FamilyItem[] = (data || []).map((item: any) => {
        const coverImage = item.imagem_thumbnail || item.imagem_micro || null;
        return {
          id: item.id,
          name: item.familia_nome,
          url_image: coverImage,
          species_count: item.especie?.[0]?.count || 0,
          description: item.descricao_familia || ''
        };
      });

      setFamilies(formattedData);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Erro ao buscar famílias botânicas:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  const handleClearFilters = () => {
    setInputValue('');
    setSearch('');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="min-h-screen flex flex-col bg-forest-50 text-neutral-800">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl text-left">
        {/* Header da Página */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-forest-900">
            Famílias Botânicas
          </h1>
          <p className="text-forest-600 mt-2 text-sm sm:text-base">
            Consulte as classificações filogenéticas e o total de espécies catalogadas no acervo público.
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white p-4 rounded-2xl border border-forest-200 shadow-xs mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md flex items-center bg-forest-50 border border-forest-200 rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-forest-400 focus-within:border-forest-400 transition-all">
            <Search className="text-forest-600 w-4 h-4 mr-2" />
            <input
              type="text"
              placeholder="Buscar família botânica por nome..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-transparent text-sm text-neutral-800 placeholder-neutral-400 outline-none border-none focus:ring-0"
            />
          </div>

          {search.trim() && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-forest-200 hover:bg-forest-50 text-neutral-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Limpar Busca
            </button>
          )}
        </div>

        {/* Contador e Resultados */}
        <div className="mb-6 flex justify-between items-center text-xs sm:text-sm font-semibold text-forest-600">
          <span>{totalCount} {totalCount === 1 ? 'família com conteúdo disponível' : 'famílias com conteúdo disponível'}</span>
        </div>

        {/* Grid de Conteúdo */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <FamilyCardSkeleton key={i} />
            ))}
          </div>
        ) : families.length === 0 ? (
          <div className="text-center py-20 bg-white border border-forest-200 rounded-3xl p-8 max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-forest-50 flex items-center justify-center mx-auto text-forest-600">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-forest-900">Nenhuma família encontrada</h3>
            <p className="text-xs text-forest-600 max-w-xs mx-auto leading-relaxed">
              {search.trim()
                ? `Não encontramos resultados para a busca "${search}". Tente buscar por outros termos ou limpe o filtro.`
                : 'Nenhuma família com conteúdo disponível no momento.'
              }
            </p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer inline-block"
            >
              Limpar Filtro
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {families.map((item) => (
                <FamilyCard
                  key={item.id}
                  family={item}
                  onClick={() => navigate(`/familias-catalogo/${item.id}`)}
                />
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-2 border border-forest-200 rounded-xl hover:bg-forest-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-forest-900 bg-white cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-xs sm:text-sm text-forest-600 font-semibold">
                  Página <span className="text-forest-900 font-bold">{page}</span> de {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-2 border border-forest-200 rounded-xl hover:bg-forest-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-forest-900 bg-white cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
