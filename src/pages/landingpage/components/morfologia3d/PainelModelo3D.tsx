import { useState, useEffect, useRef, lazy, Suspense, Component, type ReactNode } from 'react';
import { Rotate3d, RotateCcw, Maximize2, X } from 'lucide-react';
import type { ModeloOrgao } from './modelosMorfologia';

const Visualizador3D = lazy(() => import('./Visualizador3D'));

export interface PainelModelo3DProps {
  modelo: ModeloOrgao;
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class VisualizadorErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function suportaWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

export function PainelModelo3D({ modelo }: PainelModelo3DProps) {
  const [parteSelecionada, setParteSelecionada] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [visivelOuProximo, setVisivelOuProximo] = useState(() => typeof IntersectionObserver === 'undefined');
  const [temWebGL] = useState(suportaWebGL);

  const asideRef = useRef<HTMLElement>(null);
  const abrirBtnRef = useRef<HTMLButtonElement>(null);
  const expandirBtnRef = useRef<HTMLButtonElement>(null);
  const fecharBtnRef = useRef<HTMLButtonElement>(null);
  const origemAberturaRef = useRef<'mobile' | 'desktop'>('desktop');

  const centralizar = () => {
    setParteSelecionada(null);
    setResetSignal((n) => n + 1);
  };

  const abrirModal = (origem: 'mobile' | 'desktop') => {
    origemAberturaRef.current = origem;
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setTimeout(() => {
      if (origemAberturaRef.current === 'desktop') {
        expandirBtnRef.current?.focus();
      } else {
        abrirBtnRef.current?.focus();
      }
    }, 50);
  };

  // IntersectionObserver para Desktop: monta canvas apenas quando próximo da viewport
  useEffect(() => {
    const el = asideRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisivelOuProximo(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Gestão de acessibilidade, foco e bloqueio de scroll no Modal
  useEffect(() => {
    if (modalAberto) {
      document.body.style.overflow = 'hidden';
      fecharBtnRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          fecharModal();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [modalAberto]);

  const parteAtiva = modelo.partes.find((p) => p.id === parteSelecionada);
  const podeCarregarCanvas = visivelOuProximo || modalAberto;

  const renderCanvas = () => {
    if (!temWebGL) {
      return (
        <div className="w-full h-full flex items-center justify-center p-6 text-center">
          <p className="text-neutral-500 text-sm">
            Seu navegador não conseguiu exibir o modelo 3D.
          </p>
        </div>
      );
    }

    if (!podeCarregarCanvas) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 animate-pulse">
          <div className="w-12 h-12 border-4 border-forest-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-forest-600 font-medium text-sm">Carregando modelo 3D...</p>
        </div>
      );
    }

    return (
      <VisualizadorErrorBoundary
        fallback={
          <div className="w-full h-full flex items-center justify-center p-6 text-center">
            <p className="text-neutral-500 text-sm">
              Seu navegador não conseguiu exibir o modelo 3D.
            </p>
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 animate-pulse">
              <div className="w-12 h-12 border-4 border-forest-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-forest-600 font-medium text-sm">Carregando modelo 3D...</p>
            </div>
          }
        >
          <Visualizador3D
            modelo={modelo}
            parteSelecionada={parteSelecionada}
            onSelecionar={setParteSelecionada}
            resetSignal={resetSignal}
          />
        </Suspense>
      </VisualizadorErrorBoundary>
    );
  };

  const renderLegenda = () => (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label="Partes da raiz">
        {modelo.partes.map((parte, index) => {
          const isSelected = parteSelecionada === parte.id;
          return (
            <button
              key={parte.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setParteSelecionada(isSelected ? null : parte.id)}
              className={`rounded-full border border-forest-200 px-3 py-1 text-xs font-semibold text-forest-900 hover:border-forest-400 cursor-pointer transition-colors ${
                isSelected ? 'bg-forest-900 text-white border-forest-900' : 'bg-white'
              }`}
            >
              {index + 1}. {parte.rotulo}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="text-left">
        {parteAtiva ? (
          <div>
            <h3 className="text-forest-900 font-semibold text-sm">
              {parteAtiva.rotulo}
            </h3>
            <p className="text-sm text-neutral-700 leading-relaxed mt-1">
              {parteAtiva.descricao}
            </p>
          </div>
        ) : (
          <p className="text-xs text-neutral-500 leading-relaxed italic">
            Botão esquerdo gira, a roda do mouse aproxima e o botão direito move o modelo. No celular, um dedo gira e dois dedos aproximam e movem.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP (lg+): Painel sticky lateral */}
      <aside
        ref={asideRef}
        className="hidden lg:flex flex-col sticky top-20 h-[calc(100vh-8rem)] min-h-[480px] max-h-[760px] bg-white rounded-2xl border border-forest-200 shadow-xs overflow-hidden"
      >
        <div className="p-4 border-b border-forest-200 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-forest-600 font-bold block">
              Modelo 3D
            </span>
            <h2 className="text-base font-semibold text-forest-900">
              {modelo.titulo}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={centralizar}
              aria-label="Centralizar modelo"
              title="Centralizar modelo"
              className="p-2 rounded-lg text-forest-600 hover:text-forest-900 hover:bg-forest-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              ref={expandirBtnRef}
              type="button"
              onClick={() => abrirModal('desktop')}
              aria-label="Expandir visualização"
              title="Expandir visualização"
              className="p-2 rounded-lg text-forest-600 hover:text-forest-900 hover:bg-forest-50 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-forest-50 relative min-h-[260px] overflow-hidden">
          {modalAberto ? (
            <div className="w-full h-full flex items-center justify-center p-6 text-center">
              <p className="text-sm text-neutral-500">
                Visualização aberta em tela ampliada
              </p>
            </div>
          ) : (
            renderCanvas()
          )}
        </div>

        <div className="p-4 border-t border-forest-200 bg-white max-h-[45%] overflow-y-auto">
          {renderLegenda()}
        </div>
      </aside>

      {/* MOBILE (< lg): Botão flutuante */}
      <div className="lg:hidden">
        <button
          ref={abrirBtnRef}
          type="button"
          onClick={() => abrirModal('mobile')}
          className="fixed bottom-6 right-6 z-40 px-5 py-3 bg-forest-900 hover:bg-forest-800 text-white font-bold rounded-full shadow-lg text-sm flex items-center gap-2 cursor-pointer"
        >
          <Rotate3d className="w-5 h-5" />
          <span>Ver em 3D</span>
        </button>
      </div>

      {/* MODAL EXPANDIDO (Único para Desktop e Mobile) */}
      {modalAberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={modelo.titulo}
          className="fixed inset-0 z-50 flex items-center justify-center bg-forest-50 lg:bg-forest-950/60 p-0 lg:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              fecharModal();
            }
          }}
        >
          <div className="w-full h-full lg:w-[min(1200px,94vw)] lg:h-[88vh] bg-forest-50 lg:bg-white rounded-none lg:rounded-3xl border-0 lg:border lg:border-forest-200 shadow-none lg:shadow-lg flex flex-col overflow-hidden">
            {/* Cabeçalho do modal */}
            <div className="p-4 border-b border-forest-200 bg-white flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-xs uppercase tracking-widest text-forest-600 font-bold block">
                  Modelo 3D
                </span>
                <h2 className="text-base font-semibold text-forest-900">
                  {modelo.titulo}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={centralizar}
                  aria-label="Centralizar modelo"
                  title="Centralizar modelo"
                  className="p-2 rounded-lg text-forest-600 hover:text-forest-900 hover:bg-forest-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  ref={fecharBtnRef}
                  type="button"
                  onClick={fecharModal}
                  aria-label="Fechar"
                  className="p-2 rounded-lg text-forest-900 hover:bg-forest-50 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Corpo do modal */}
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] overflow-hidden">
              <div className="flex-1 relative overflow-hidden bg-forest-50 min-h-[300px]">
                {renderCanvas()}
              </div>

              <div className="bg-white rounded-t-3xl lg:rounded-none border-t lg:border-t-0 lg:border-l border-forest-200 max-h-[42vh] lg:max-h-none overflow-y-auto p-5 shadow-lg lg:shadow-none">
                {renderLegenda()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
