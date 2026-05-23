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
    <div className="min-h-screen flex flex-col bg-[#f8faf6] text-stone-850">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl text-left">
        {/* Header da Página */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1a3a1f]">
            Famílias Botânicas
          </h1>
          <p className="text-[#4a7c5a] mt-2 text-sm sm:text-base">
            Consulte as classificações filogenéticas e o total de espécies catalogadas no acervo público.
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white p-4 rounded-2xl border border-[#dde8d5] shadow-xs mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md flex items-center bg-[#f8faf6] border border-[#dde8d5] rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-[#5fcf6e] focus-within:border-[#5fcf6e] transition-all">
            <Search className="text-[#4a7c5a] w-4 h-4 mr-2" />
            <input
              type="text"
              placeholder="Buscar família botânica por nome..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-transparent text-sm text-stone-800 placeholder-stone-400 outline-none border-none focus:ring-0"
            />
          </div>

          {search.trim() && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-[#dde8d5] hover:bg-[#f8faf6] text-stone-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Limpar Busca
            </button>
          )}
        </div>

        {/* Contador e Resultados */}
        <div className="mb-6 flex justify-between items-center text-xs sm:text-sm font-semibold text-[#4a7c5a]">
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
          <div className="text-center py-20 bg-white border border-[#dde8d5] rounded-3xl p-8 max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#f8faf6] flex items-center justify-center mx-auto text-[#4a7c5a]">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1a3a1f]">Nenhuma família encontrada</h3>
            <p className="text-xs text-[#4a7c5a] max-w-xs mx-auto leading-relaxed">
              {search.trim()
                ? `Não encontramos resultados para a busca "${search}". Tente buscar por outros termos ou limpe o filtro.`
                : 'Nenhuma família com conteúdo disponível no momento.'
              }
            </p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-[#1a3a1f] hover:bg-[#2d5a3d] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer inline-block"
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
                  className="p-2 border border-[#dde8d5] rounded-xl hover:bg-[#f0f5ee] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[#1a3a1f] bg-white cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-xs sm:text-sm text-[#4a7c5a] font-semibold">
                  Página <span className="text-[#1a3a1f] font-bold">{page}</span> de {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-2 border border-[#dde8d5] rounded-xl hover:bg-[#f0f5ee] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[#1a3a1f] bg-white cursor-pointer"
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
