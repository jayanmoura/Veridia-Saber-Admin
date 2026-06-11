import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

interface ConteudoOrgaoItem {
  id: number;
  orgao: string;
  titulo: string;
  conteudo: string | null;
  ordem: number;
}

const iconePorOrgao: Record<string, string> = {
  'Raiz': '🌱',
  'Caule': '🌿',
  'Folha': '🍃',
  'Flor': '🌸',
  'Fruto': '🍎',
  'Semente': '🌰'
};

export default function MorfologiaPage() {
  const [porOrgao, setPorOrgao] = useState<Record<string, ConteudoOrgaoItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConteudo() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('conteudo_orgaos')
          .select('id, orgao, titulo, conteudo, ordem')
          .order('orgao', { ascending: true })
          .order('ordem', { ascending: true });

        if (fetchError) throw fetchError;

        const grouped = (data ?? []).reduce<Record<string, ConteudoOrgaoItem[]>>((acc, item) => {
          const itemOrgao = item.orgao || 'Geral';
          if (!acc[itemOrgao]) acc[itemOrgao] = [];
          acc[itemOrgao].push(item as ConteudoOrgaoItem);
          return acc;
        }, {});

        setPorOrgao(grouped);
      } catch (err) {
        console.error('Erro ao buscar morfologia:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar o conteúdo de morfologia vegetal.');
      } finally {
        setLoading(false);
      }
    }

    fetchConteudo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-forest-50 text-neutral-800">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-forest-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-forest-600 font-medium text-sm animate-pulse">Carregando morfologia vegetal...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-forest-50 text-neutral-800">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-20 px-6 text-center">
          <ShieldAlert className="text-red-500 w-16 h-16 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-forest-900">Erro ao carregar conteúdo</h2>
          <p className="text-forest-600 mt-2 max-w-sm text-sm">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-forest-900 hover:bg-forest-800 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm"
          >
            Tentar Novamente
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Ordem lógica botânica
  const ordemOrgaos = ['Raiz', 'Caule', 'Folha', 'Flor', 'Fruto', 'Semente'];

  // Ordenar as keys do objeto porOrgao
  const orgaosOrdenados = Object.keys(porOrgao).sort((a, b) => {
    const ia = ordemOrgaos.indexOf(a);
    const ib = ordemOrgaos.indexOf(b);
    // Se não estiver na lista de ordem, jogar para o final em ordem alfabética
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return (
    <div className="min-h-screen flex flex-col bg-forest-50 text-neutral-800">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl text-left">
        {/* Header da página */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-100 to-forest-50 border border-forest-200 p-8 md:p-10 mb-12 flex items-center justify-between shadow-xs">
          <div className="max-w-2xl z-10">
            <span className="text-xs uppercase tracking-widest text-forest-600 font-bold">
              Estudo Botânico
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-forest-900 mt-1">
              Morfologia Vegetal
            </h1>
            <p className="text-forest-600 text-sm md:text-base mt-2 leading-relaxed font-normal">
              Estude a estrutura externa das plantas — raízes, caules, folhas, flores, frutos e sementes. Compreenda a anatomia descritiva que auxilia na identificação das espécies botânicas no campo.
            </p>
          </div>
          <div className="hidden md:block text-forest-400/15 flex-shrink-0 mr-4 z-0">
            <svg
              width="100"
              height="100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-24 h-24 transform rotate-12"
            >
              <path d="M2 22C2 22 17 21 22 2C22 2 13 3 11 11C9 13 6 14.5 2 22Z" />
              <path d="M9 13C9 13 13 14 18 11.5" />
              <path d="M12 10C12 10 15.5 10 18.5 7" />
              <path d="M5.5 17C5.5 17 8 18 10 16.5" />
            </svg>
          </div>
        </div>

        {/* Órgãos Cadastrados */}
        {Object.keys(porOrgao).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-forest-200 shadow-xs">
            <Leaf size={48} className="mx-auto text-neutral-300 mb-3 animate-pulse" />
            <p className="text-sm text-neutral-500 italic">
              Nenhum conteúdo de morfologia disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orgaosOrdenados.map((orgao) => {
              const topicos = porOrgao[orgao] || [];
              const emoji = iconePorOrgao[orgao] || '🔬';
              return (
                <Link
                  to={`/morfologia/${encodeURIComponent(orgao)}`}
                  key={orgao}
                  className="group bg-white rounded-2xl border border-stone-200 p-6 hover:shadow-lg hover:border-emerald-500 hover:scale-[1.005] transition-all duration-300 cursor-pointer flex items-start gap-5 text-left"
                >
                  {/* Ícone */}
                  <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-emerald-50 transition-colors duration-300">
                    {emoji}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-forest-900 group-hover:text-forest-800 transition-colors leading-snug">
                      {orgao}
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1 font-semibold">
                      {topicos.length} tópico{topicos.length !== 1 ? 's' : ''}
                    </p>
                    
                    {/* Lista prévia dos títulos */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {topicos.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className="text-[10px] bg-forest-100 text-forest-600 px-2 py-0.5 rounded-full font-medium"
                        >
                          {t.titulo}
                        </span>
                      ))}
                      {topicos.length > 3 && (
                        <span className="text-[10px] text-neutral-500 font-medium self-center">
                          +{topicos.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-forest-400 text-xl font-bold self-center transform translate-x-0 group-hover:translate-x-1.5 transition-transform duration-300">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
