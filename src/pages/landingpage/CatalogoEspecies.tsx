import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import type { SpeciesItem } from './components/SpeciesCard';
import { SkeletonCard } from './components/SkeletonCard';

interface FamilyOption {
  id: string;
  name: string;
}

export default function CatalogoEspecies() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  // Component States
  const [species, setSpecies] = useState<SpeciesItem[]>([]);
  const [families, setFamilies] = useState<FamilyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter States
  const [inputValue, setInputValue] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery);
  const [familyId, setFamilyId] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Sync search input if URL params change
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setInputValue(q);
    setSearch(q);
  }, [searchParams]);

  // Debounce for search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(inputValue);
      setPage(1);
      // Update URL query string silently without reloading page context
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        if (inputValue.trim()) {
          newParams.set('q', inputValue.trim());
        } else {
          newParams.delete('q');
        }
        return newParams;
      }, { replace: true });
    }, 300);

    return () => clearTimeout(handler);
  }, [inputValue, setSearchParams]);

  // Fetch families options for filter dropdown
  const loadFamilies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('familia')
        .select('id, familia_nome')
        .order('familia_nome', { ascending: true });

      if (error) throw error;
      setFamilies((data || []).map((f: { id: string; familia_nome: string }) => ({
        id: f.id,
        name: f.familia_nome
      })));
    } catch (err) {
      console.error('Erro ao buscar famílias para filtro:', err);
    }
  }, []);

  // Fetch species data based on search, family filter and pagination
  const loadSpecies = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('especie')
        .select(`
          id,
          nome_cientifico,
          nome_popular,
          familia_id,
          codigo_vs,
          familia:familia_id (
            familia_nome
          )
        `, { count: 'exact' });

      if (search.trim()) {
        const cleanSearch = search.trim();
        query = query.or(`nome_cientifico.ilike.%${cleanSearch}%,nome_popular.ilike.%${cleanSearch}%`);
      }

      if (familyId) {
        query = query.eq('familia_id', familyId);
      }

      query = query.order('nome_cientifico', { ascending: true }).range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const especieIds = (data || []).map(item => item.id);
      let imagensTipoA: Array<{
        id: string;
        especie_id: string | null;
        url_micro: string | null;
        url_thumbnail: string | null;
      }> = [];
      let imagensTipoB: Array<{
        id: string;
        especime_id: number | null;
        url_micro: string | null;
        url_thumbnail: string | null;
      }> = [];
      const especimeParaEspecie: Record<number, string> = {};

      if (especieIds.length > 0) {
        // Query A: Imagens Tipo A (especie_id preenchido)
        const { data: imgDataA, error: imgErrorA } = await supabase
          .from('imagens')
          .select('id, especie_id, url_micro, url_thumbnail')
          .in('especie_id', especieIds)
          .not('url_micro', 'is', null)
          .order('created_at', { ascending: true });

        if (imgErrorA) throw imgErrorA;
        imagensTipoA = (imgDataA ?? []) as typeof imagensTipoA;

        // Query B: Buscar os espécimes vinculados a essas espécies
        const { data: especimes, error: especimesError } = await supabase
          .from('especie_local')
          .select('id, especie_id')
          .in('especie_id', especieIds);

        if (especimesError) throw especimesError;

        const especimesFormatados = (especimes ?? []) as Array<{ id: number; especie_id: string }>;
        const especimeIds = especimesFormatados.map(e => e.id);
        for (const esp of especimesFormatados) {
          especimeParaEspecie[esp.id] = esp.especie_id;
        }

        if (especimeIds.length > 0) {
          // Query B2: Imagens Tipo B (especime_id preenchido, especie_id nulo)
          const { data: imgDataB, error: imgErrorB } = await supabase
            .from('imagens')
            .select('id, especime_id, url_micro, url_thumbnail')
            .in('especime_id', especimeIds)
            .filter('especie_id', 'is', null)
            .not('url_micro', 'is', null)
            .order('created_at', { ascending: true });

          if (imgErrorB) throw imgErrorB;
          imagensTipoB = (imgDataB ?? []) as typeof imagensTipoB;
        }
      }

      const mapaImagens: Record<string, string> = {};
      const vistoTipoB = new Set<string>();

      // Tipo A como fallback (processado primeiro)
      for (const img of imagensTipoA) {
        if (img.especie_id && !mapaImagens[img.especie_id]) {
          mapaImagens[img.especie_id] = img.url_micro || img.url_thumbnail || '';
        }
      }

      // Tipo B como preferencial (sobrescreve se houver)
      for (const img of imagensTipoB) {
        const espId = img.especime_id;
        const espEspecieId = espId ? especimeParaEspecie[espId] : null;
        if (espEspecieId && !vistoTipoB.has(espEspecieId)) {
          vistoTipoB.add(espEspecieId);
          mapaImagens[espEspecieId] = img.url_micro || img.url_thumbnail || '';
        }
      }

      const formattedData: SpeciesItem[] = (data || []).map((item: { id: string; nome_cientifico: string; nome_popular: string | null; familia_id: string | null; familia: { familia_nome: string } | { familia_nome: string }[] | null; codigo_vs?: string | null }) => {
        const famObj = Array.isArray(item.familia) ? item.familia[0] : item.familia;
        return {
          id: item.id,
          name_scientific: item.nome_cientifico,
          name_popular: item.nome_popular,
          family_name: famObj?.familia_nome || '',
          url_micro: mapaImagens[item.id] || null
        };
      });

      setSpecies(formattedData);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Erro ao buscar espécies do catálogo:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, familyId]);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  useEffect(() => {
    loadSpecies();
  }, [loadSpecies]);

  const handleFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFamilyId(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setInputValue('');
    setSearch('');
    setFamilyId('');
    setPage(1);
    navigate('/catalogo', { replace: true });
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="min-h-screen flex flex-col bg-forest-50 text-neutral-950">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl text-left">
        {/* Header da Página */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-forest-900">
            Espécies Botânicas
          </h1>
          <p className="text-forest-600 mt-2 text-sm sm:text-base">
            Explore a diversidade taxonômica catalogada no acervo público do Veridia Saber.
          </p>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-white p-4 rounded-2xl border border-forest-200 shadow-xs mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md flex items-center bg-forest-50 border border-forest-200 rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-forest-400 focus-within:border-forest-400 transition-all">
            <Search className="text-forest-600 w-4 h-4 mr-2" />
            <input
              type="text"
              placeholder="Buscar por nome científico ou popular..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-transparent text-sm text-stone-800 placeholder-stone-400 outline-none border-none focus:ring-0"
            />
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full justify-end">
            <div className="flex items-center gap-2 bg-forest-50 border border-forest-200 rounded-xl px-3 py-2">
              <SlidersHorizontal className="text-forest-600 w-4 h-4" />
              <select
                value={familyId}
                onChange={handleFamilyChange}
                className="bg-transparent text-xs text-forest-900 font-semibold outline-none border-none focus:ring-0 cursor-pointer min-w-[150px]"
              >
                <option value="">Todas as famílias</option>
                {families.map((fam) => (
                  <option key={fam.id} value={fam.id}>
                    {fam.name}
                  </option>
                ))}
              </select>
            </div>

            {(search.trim() || familyId) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-forest-200 hover:bg-forest-50 text-stone-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Contador e Resultados */}
        <div className="mb-6 flex justify-between items-center text-xs sm:text-sm font-semibold text-forest-600">
          <span>{totalCount} {totalCount === 1 ? 'espécie encontrada' : 'espécies encontradas'}</span>
        </div>

        {/* Grid de Conteúdo */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : species.length === 0 ? (
          <div className="text-center py-20 bg-white border border-forest-200 rounded-3xl p-8 max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-forest-50 flex items-center justify-center mx-auto text-forest-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                <path d="M12 2C6 2 2 8 2 12c0 5.5 4.5 9 10 9s10-3.5 10-9C22 8 18 2 12 2z"/>
                <path d="M12 2v19M2 12h20"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-forest-900">Nenhuma espécie encontrada</h3>
            <p className="text-xs text-forest-600 max-w-xs mx-auto leading-relaxed">
              Não encontramos resultados para {search.trim() ? `"${search}"` : 'os filtros selecionados'}. Tente refinar sua busca ou limpe os filtros.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer inline-block"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {species.map((item) => (
                <Link
                  to={`/catalogo/especie/${item.id}`}
                  key={item.id}
                  className="block bg-white rounded-2xl border border-forest-200 overflow-hidden hover:shadow-md hover:border-forest-400 transition-all duration-200 cursor-pointer"
                >
                  {/* imagem sem badge */}
                  <div className="aspect-[4/3] overflow-hidden">
                    {item.url_micro ? (
                      <img src={item.url_micro} alt={item.name_scientific}
                           className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-forest-800">
                        <span className="text-3xl">🌿</span>
                      </div>
                    )}
                  </div>
                  {/* conteúdo textual */}
                  <div className="p-4">
                    <p className="font-semibold italic text-forest-900">{item.name_scientific}</p>
                    {item.name_popular && (
                      <p className="text-sm text-forest-600 mt-1">{item.name_popular}</p>
                    )}
                    <p className="text-sm text-forest-400 mt-3 font-semibold">Ver detalhes →</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-2 border border-forest-200 rounded-xl hover:bg-forest-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-forest-900 bg-white cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-xs sm:text-sm text-forest-600 font-semibold">
                  Página <span className="text-forest-900 font-bold">{page}</span> de {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-2 border border-forest-200 rounded-xl hover:bg-forest-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-forest-900 bg-white cursor-pointer"
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
