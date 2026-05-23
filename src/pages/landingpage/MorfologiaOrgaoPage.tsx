import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Leaf, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

interface TopicoItem {
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

export default function MorfologiaOrgaoPage() {
  const { orgao } = useParams<{ orgao: string }>();
  const navigate = useNavigate();

  const [topicos, setTopicos] = useState<TopicoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Controle do Accordion
  const [aberto, setAberto] = useState<number | null>(null);

  const orgaoDecodificado = decodeURIComponent(orgao ?? '');

  const fetchTopicos = useCallback(async () => {
    if (!orgao) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('conteudo_orgaos')
        .select('id, orgao, titulo, conteudo, ordem')
        .eq('orgao', orgaoDecodificado)
        .order('ordem', { ascending: true });

      if (fetchError) throw fetchError;
      setTopicos((data ?? []) as TopicoItem[]);
    } catch (err) {
      console.error('Erro ao buscar tópicos do órgão:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar tópicos de morfologia.');
    } finally {
      setLoading(false);
    }
  }, [orgao, orgaoDecodificado]);

  useEffect(() => {
    fetchTopicos();
  }, [fetchTopicos]);

  const emoji = iconePorOrgao[orgaoDecodificado] || '🔬';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8faf6] text-stone-850">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-[#5fcf6e] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#4a7c5a] font-medium text-sm animate-pulse">Carregando tópicos de {orgaoDecodificado}...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !orgao) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8faf6] text-stone-850">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-20 px-6 text-center">
          <ShieldAlert className="text-red-500 w-16 h-16 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-[#1a3a1f]">Erro ao carregar tópicos</h2>
          <p className="text-[#4a7c5a] mt-2 max-w-sm text-sm">
            {error || 'Não foi possível identificar o órgão selecionado.'}
          </p>
          <button
            onClick={() => navigate('/morfologia')}
            className="mt-6 px-6 py-3 bg-[#1a3a1f] hover:bg-[#2d5a3d] text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm"
          >
            Voltar para Morfologia
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf6] text-stone-850">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl text-left">
        {/* Botão voltar */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/morfologia')}
            className="flex items-center gap-2 text-sm font-semibold text-[#4a7c5a] hover:text-[#1a3a1f] transition-colors cursor-pointer bg-transparent border-none outline-none"
          >
            <span>← Morfologia Vegetal</span>
          </button>
        </div>

        {/* Header do órgão */}
        <div className="mb-8 border-b border-[#dde8d5] pb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{emoji}</span>
            <h1 className="text-3xl font-bold text-[#1a3a1f] capitalize">
              {orgaoDecodificado}
            </h1>
          </div>
          <p className="text-sm text-[#7a9a7a] mt-1 font-medium">
            Selecione um tópico para estudar
          </p>
        </div>

        {/* Lista de tópicos Accordion */}
        {topicos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#dde8d5] shadow-xs">
            <Leaf size={40} className="mx-auto text-stone-300 mb-2 animate-pulse" />
            <p className="text-sm text-stone-500 italic">
              Nenhum tópico cadastrado para este órgão.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topicos.map((topico) => (
              <div
                key={topico.id}
                className="bg-white rounded-2xl border border-[#dde8d5] overflow-hidden hover:border-[#5fcf6e] transition-all duration-300 shadow-xs"
              >
                {/* Header do tópico — clicável */}
                <button
                  onClick={() => setAberto(aberto === topico.id ? null : topico.id)}
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer bg-transparent border-none outline-none"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <span className="text-[#5fcf6e] font-mono text-sm font-bold flex-shrink-0">
                      {String(topico.ordem).padStart(2, '0')}
                    </span>
                    <span className="font-semibold text-[#1a3a1f] truncate leading-snug">
                      {topico.titulo}
                    </span>
                  </div>
                  <span
                    className={`text-[#4a7c5a] text-sm transform transition-transform duration-300 flex-shrink-0 ${
                      aberto === topico.id ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {/* Conteúdo expandido */}
                {aberto === topico.id && (
                  <div className="px-5 pb-5 border-t border-[#dde8d5] bg-stone-50/30">
                    {topico.conteudo ? (
                      <div
                        className="pt-4
                                   [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-[#1a3a1f] [&_h1]:mb-3 [&_h1]:mt-4
                                   [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#1a3a1f] [&_h2]:mb-2 [&_h2]:mt-4
                                   [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#4a7c5a] [&_h3]:mb-2 [&_h3]:mt-3
                                   [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:text-[#4a5a44]
                                   [&_strong]:font-semibold [&_strong]:text-[#1a3a1f]
                                   [&_em]:italic [&_em]:text-[#4a5a44]
                                   [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
                                   [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
                                   [&_li]:leading-relaxed [&_li]:text-[#4a5a44]
                                   [&_blockquote]:border-l-4 [&_blockquote]:border-[#5fcf6e]
                                   [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#7a9a7a]
                                   [&_blockquote]:my-3
                                   [&_hr]:border-[#dde8d5] [&_hr]:my-4"
                        dangerouslySetInnerHTML={{
                          __html: marked(topico.conteudo ?? '') as string
                        }}
                      />
                    ) : (
                      <p className="text-sm text-[#7a9a7a] italic pt-4 font-normal">
                        Conteúdo em breve.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
