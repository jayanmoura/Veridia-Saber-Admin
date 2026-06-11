import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

interface LocalItem {
  id: string;
  nome: string;
  descricao: string | null;
  cidade: string | null;
  estado: string | null;
  tipo: string | null;
  sigla: string | null;
  imagem_capa: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function LocalsPublicos() {
  const [locais, setLocais] = useState<LocalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [tiposUnicos, setTiposUnicos] = useState<string[]>([]);

  const fetchLocais = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('locais')
        .select('id, nome, descricao, cidade, estado, tipo, sigla, imagem_capa, latitude, longitude')
        .order('nome', { ascending: true });

      if (error) throw error;

      const formatted = ((data ?? []) as Array<{
        id: string;
        nome: string;
        descricao: string | null;
        cidade: string | null;
        estado: string | null;
        tipo: string | null;
        sigla: string | null;
        imagem_capa: string | null;
        latitude: number | null;
        longitude: number | null;
      }>).map((item) => ({
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        cidade: item.cidade,
        estado: item.estado,
        tipo: item.tipo,
        sigla: item.sigla,
        imagem_capa: item.imagem_capa,
        latitude: item.latitude,
        longitude: item.longitude
      }));

      setLocais(formatted);

      // Extrai os tipos únicos de locais para o filtro
      const tipos = Array.from(new Set(formatted.map(l => l.tipo).filter(Boolean))) as string[];
      setTiposUnicos(tipos);
    } catch (err) {
      console.error('Erro ao buscar locais públicos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocais();
  }, [fetchLocais]);

  const locaisFiltrados = locais.filter(l => {
    if (!filterTipo) return true;
    return l.tipo === filterTipo;
  });

  return (
    <div className="min-h-screen flex flex-col bg-forest-50 text-neutral-800">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl text-left">
        {/* Header da Página */}
        <div className="mb-10 animate-fade-in">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-400/15 text-forest-600 mb-3">
            Rede de Projetos
          </span>
          <h1 className="text-3xl font-bold text-forest-900">
            Locais de Ocorrência
          </h1>
          <p className="text-forest-600 mt-2 text-sm sm:text-base">
            Conheça os locais, reservas e parques monitorados pelo ecossistema científico do Veridia Saber.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-forest-200 shadow-xs mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 bg-forest-50 border border-forest-200 rounded-xl px-3 py-2 w-full sm:w-auto">
            <SlidersHorizontal className="text-forest-600 w-4 h-4" />
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="bg-transparent text-xs text-forest-900 font-semibold outline-none border-none focus:ring-0 cursor-pointer min-w-[180px] w-full"
            >
              <option value="">Todos os tipos de locais</option>
              {tiposUnicos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs font-semibold text-forest-600">
            {locaisFiltrados.length} {locaisFiltrados.length === 1 ? 'local listado' : 'locais listados'}
          </span>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-forest-200 p-6 space-y-4 animate-pulse h-48">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-200 rounded-md w-2/3"></div>
                    <div className="h-3 bg-neutral-200 rounded-md w-1/3"></div>
                  </div>
                </div>
                <div className="h-3 bg-neutral-300 rounded-md w-full"></div>
                <div className="h-3 bg-neutral-200 rounded-md w-5/6"></div>
              </div>
            ))}
          </div>
        ) : locaisFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white border border-forest-200 rounded-3xl p-8 max-w-sm mx-auto space-y-4">
            <MapPin className="w-12 h-12 text-neutral-300 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-forest-900">Nenhum local cadastrado</h3>
            <p className="text-xs text-forest-600">
              Não encontramos nenhum local correspondente ao filtro aplicado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locaisFiltrados.map((local) => (
              <Link
                to={`/locais-publico/${local.id}`}
                key={local.id}
                className="group bg-white rounded-2xl border border-forest-200 overflow-hidden hover:shadow-md hover:border-forest-400 transition-all duration-200 cursor-pointer flex flex-col h-full"
              >
                {/* Imagem de Capa */}
                <div className="h-48 w-full overflow-hidden relative bg-forest-800 flex items-center justify-center text-white flex-shrink-0">
                  {local.imagem_capa ? (
                    <img
                      src={local.imagem_capa}
                      alt={local.nome}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  ) : (
                    <MapPin size={48} className="text-forest-400/60" />
                  )}
                </div>

                {/* Body do Card */}
                <div className="p-6 flex flex-col flex-grow justify-between text-left">
                  <div className="space-y-3">
                    {/* Badge tipo e sigla */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-forest-100 text-forest-600">
                        {local.tipo || 'Geral'}
                      </span>
                      {local.sigla && (
                        <span className="text-xs text-forest-600 font-mono font-bold">
                          {local.sigla}
                        </span>
                      )}
                    </div>

                    {/* Nome e Cidade/Estado */}
                    <div>
                      <h3 className="font-semibold text-forest-900 text-base group-hover:text-forest-500 transition-colors leading-snug">
                        {local.nome}
                      </h3>
                      <p className="text-sm text-neutral-500 mt-1 font-medium">
                        {local.cidade && local.estado
                          ? `${local.cidade}, ${local.estado}`
                          : local.cidade || local.estado || 'Localização não informada'}
                      </p>
                    </div>

                    {/* Descrição */}
                    {local.descricao && (
                      <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed font-normal">
                        {local.descricao}
                      </p>
                    )}
                  </div>

                  {/* Rodapé Card */}
                  <div className="pt-4 mt-6 border-t border-forest-200">
                    <span className="text-sm text-forest-400 group-hover:text-forest-500 transition-colors font-semibold flex items-center gap-1">
                      Ver detalhes
                      <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
