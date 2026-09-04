import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Leaf, Info, ShieldAlert, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Leaflet
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapBoundsUpdater } from './components/MapBoundsUpdater';

const SPECIMEN_MARKER_COLOR = '#4a7c5a';

interface EspecimeDetails {
  id: number;
  tombo_codigo: string | null;
  tombo_num: number | null;
  descricao_ocorrencia: string | null;
  detalhes_localizacao: string | null;
  latitude: number | null;
  longitude: number | null;
  coletor: string | null;
  data_determinacao: string | null;
  morfologia: string | null;
  habitat_ecologia: string | null;
  numero_coletor: string | null;
  especie_id: string;
  local_id: string;
}

interface EspecieDetails {
  id: string;
  nome_cientifico: string;
  nome_popular: string | null;
  familia_id: string | null;
  autor: string | null;
  descricao_especie: string | null;
  familia: {
    id: string;
    familia_nome: string;
  } | {
    id: string;
    familia_nome: string;
  }[] | null;
}

interface LocalDetails {
  id: string;
  nome: string;
  sigla: string | null;
}

interface ImagemDetails {
  id: string;
  url_thumbnail: string | null;
  url_micro: string | null;
  url_imagem: string | null;
  creditos: string | null;
}

export default function DetalhesEspecimeLocal() {
  const { localId, especimeId } = useParams<{ localId: string; especimeId: string }>();
  const navigate = useNavigate();

  const [especime, setEspecime] = useState<EspecimeDetails | null>(null);
  const [especie, setEspecie] = useState<EspecieDetails | null>(null);
  const [local, setLocal] = useState<LocalDetails | null>(null);
  const [imagens, setImagens] = useState<ImagemDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados do Carrossel e Lightbox da Galeria
  const [currentIndex, setCurrentIndex] = useState(0);
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState<number | null>(null);

  const fetchTudo = useCallback(async () => {
    if (!especimeId || !localId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Dados do espécime
      const { data: especimeData, error: especimeError } = await supabase
        .from('especie_local')
        .select(`
          id, tombo_codigo, tombo_num,
          descricao_ocorrencia, detalhes_localizacao,
          latitude, longitude, coletor, data_determinacao,
          morfologia, habitat_ecologia, numero_coletor,
          especie_id, local_id
        `)
        .eq('id', especimeId)
        .single();

      if (especimeError) throw especimeError;
      const especimeRes = especimeData as EspecimeDetails;

      // 2. Dados da espécie e override do local
      const [especieDataRes, overrideRes] = await Promise.all([
        supabase
          .from('especie')
          .select('id, nome_cientifico, nome_popular, familia_id, autor, descricao_especie, familia:familia_id(id, familia_nome)')
          .eq('id', especimeRes.especie_id)
          .single(),
        supabase
          .from('especie_local_overrides')
          .select('descricao_especie')
          .eq('especie_id', especimeRes.especie_id)
          .eq('local_id', localId)
          .maybeSingle(),
      ]);

      if (especieDataRes.error) throw especieDataRes.error;
      const especieRes = especieDataRes.data as EspecieDetails;
      if (overrideRes.data?.descricao_especie) {
        especieRes.descricao_especie = overrideRes.data.descricao_especie;
      }

      // 3. Dados do local (para o breadcrumb)
      const { data: localData, error: localError } = await supabase
        .from('locais')
        .select('id, nome, sigla')
        .eq('id', localId)
        .single();

      if (localError) throw localError;
      const localRes = localData as LocalDetails;

      // 4. Imagens deste espécime
      const { data: imagensData, error: imgError } = await supabase
        .from('imagens')
        .select('id, url_thumbnail, url_micro, url_imagem, creditos')
        .eq('especime_id', parseInt(especimeId))
        .filter('especie_id', 'is', null)
        .not('url_thumbnail', 'is', null)
        .order('created_at', { ascending: true });

      if (imgError) throw imgError;
      const imagensRes = (imagensData ?? []) as ImagemDetails[];

      setEspecime(especimeRes);
      setEspecie(especieRes);
      setLocal(localRes);
      setImagens(imagensRes);
    } catch (err) {
      console.error('Erro ao carregar detalhes do espécime:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao carregar as informações do espécime.');
    } finally {
      setLoading(false);
    }
  }, [especimeId, localId]);

  useEffect(() => {
    fetchTudo();
  }, [fetchTudo]);

  // Auto-avanço de 5 segundos no carrossel de topo
  useEffect(() => {
    if (imagens.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % imagens.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [imagens.length]);

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + imagens.length) % imagens.length);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % imagens.length);
  };

  const prevGalleryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryLightboxIndex !== null) {
      setGalleryLightboxIndex(prev =>
        prev !== null ? (prev - 1 + imagens.length) % imagens.length : null
      );
    }
  };

  const nextGalleryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryLightboxIndex !== null) {
      setGalleryLightboxIndex(prev =>
        prev !== null ? (prev + 1) % imagens.length : null
      );
    }
  };

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return 'Não informada';
    try {
      const date = new Date(dataStr);
      return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch {
      return dataStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-forest-50 text-neutral-800">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-forest-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-forest-600 font-medium text-sm animate-pulse">Carregando detalhes do espécime...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !especime || !especie) {
    return (
      <div className="min-h-screen flex flex-col bg-forest-50 text-neutral-800">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-20 px-6 text-center">
          <ShieldAlert className="text-red-500 w-16 h-16 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-forest-900">Espécime não encontrado</h2>
          <p className="text-forest-600 mt-2 max-w-sm text-sm">
            {error || 'O registro do espécime que você tentou acessar não foi localizado ou foi removido do sistema.'}
          </p>
          <button
            onClick={() => navigate(`/locais-publico/${localId}`)}
            className="mt-6 px-6 py-3 bg-forest-900 hover:bg-forest-800 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm"
          >
            Voltar para o Local
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-forest-50 text-neutral-800">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl text-left">
        {/* A. Breadcrumb / botão voltar */}
        <div className="flex items-center gap-2 text-sm text-forest-600 mb-6 flex-wrap">
          <button
            onClick={() => navigate(`/locais-publico/${localId}`)}
            className="hover:text-forest-900 cursor-pointer bg-transparent border-none outline-none font-semibold text-forest-600 transition-colors"
          >
            ← {local?.nome || 'Local'}
          </button>
          <span className="text-forest-200">/</span>
          <span className="italic text-forest-900 font-semibold">{especie.nome_cientifico}</span>
          <span className="text-forest-200">/</span>
          <span className="font-mono text-xs bg-forest-100 px-2 py-0.5 rounded font-bold text-forest-900">
            {especime.tombo_codigo || `#${especime.id}`}
          </span>
        </div>

        {/* B. Carrossel de imagens */}
        {imagens.length > 0 ? (
          <div className="w-full h-neutral-700 rounded-2xl overflow-hidden relative mb-8 bg-neutral-600 shadow-xs">
            <img
              src={imagens[currentIndex]?.url_thumbnail || imagens[currentIndex]?.url_imagem || undefined}
              alt={especie.nome_popular || especie.nome_cientifico}
              className="object-cover w-full h-full select-none"
            />

            {imagens.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-neutral-800 hover:text-black w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-md cursor-pointer transition-all z-10 select-none"
                >
                  ‹
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-neutral-800 hover:text-black w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-md cursor-pointer transition-all z-10 select-none"
                >
                  ›
                </button>

                <div className="flex gap-2 justify-center absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                  {imagens.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                        index === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Ir para imagem ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {imagens[currentIndex]?.creditos && (
              <span className="absolute bottom-4 right-4 text-xs text-white/60 bg-black/40 px-3 py-1 rounded-full pointer-events-none select-none z-10">
                {imagens[currentIndex].creditos}
              </span>
            )}
          </div>
        ) : (
          <div className="w-full h-[400px] bg-forest-800 rounded-2xl flex flex-col items-center justify-center text-white mb-8 shadow-xs">
            <Leaf size={64} className="text-forest-400 mb-2 animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-wider text-forest-400/80">Sem imagens do espécime</span>
          </div>
        )}

        {/* C. Header do espécime */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-12">
          {/* Coluna Esquerda: Nomenclatura */}
          <div className="md:col-span-2 space-y-4 text-left">
            <h1 className="text-3xl font-bold text-forest-900 flex items-baseline gap-2 flex-wrap leading-tight">
              <span className="italic font-serif">{especie.nome_cientifico}</span>
              {especie.autor && (
                <span className="text-sm text-neutral-500 font-normal font-sans block sm:inline sm:ml-2">
                  {especie.autor}
                </span>
              )}
            </h1>
            {especie.nome_popular && (
              <h2 className="text-base font-medium text-forest-400 capitalize">
                {especie.nome_popular}
              </h2>
            )}
            {especime.tombo_codigo && (
              <div className="pt-2">
                <span className="font-mono text-xs font-bold bg-forest-100 border border-forest-200 rounded-lg px-3 py-1.5 text-forest-600 inline-block">
                  Tombo: {especime.tombo_codigo}
                </span>
              </div>
            )}
          </div>

          {/* Coluna Direita: Dados do Espécime */}
          <div className="bg-forest-100 rounded-2xl border border-forest-200 p-5 text-xs text-left space-y-3 shadow-xs">
            <h3 className="font-bold text-forest-900 text-sm pb-2 border-b border-forest-200 flex items-center gap-1.5">
              <Info size={14} className="text-forest-600" />
              Dados do Espécime
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-neutral-500">Tombo</span>
                <span className="text-forest-900 font-mono font-bold">{especime.tombo_codigo || 'Não informado'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-forest-200/40">
                <span className="font-semibold text-neutral-500">Família</span>
                {especie.familia ? (
                  <Link
                    to={`/familias-catalogo/${Array.isArray(especie.familia) ? especie.familia[0].id : especie.familia.id}`}
                    className="font-bold text-forest-900 hover:underline"
                  >
                    {Array.isArray(especie.familia) ? especie.familia[0].familia_nome : especie.familia.familia_nome}
                  </Link>
                ) : (
                  <span className="text-neutral-400">Não associada</span>
                )}
              </div>

              <div className="flex justify-between items-center py-1 border-t border-forest-200/40">
                <span className="font-semibold text-neutral-500">Coletor</span>
                <span className="text-forest-600 font-medium text-right max-w-[150px] truncate" title={especime.coletor || ''}>
                  {especime.coletor || 'Não informado'}
                </span>
              </div>

              {especime.numero_coletor && (
                <div className="flex justify-between items-center py-1 border-t border-forest-200/40">
                  <span className="font-semibold text-neutral-500">Nº Coletor</span>
                  <span className="text-forest-600 font-mono font-bold bg-white px-2 py-0.5 rounded border border-forest-200">
                    {especime.numero_coletor}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-t border-forest-200/40">
                <span className="font-semibold text-neutral-500">Data de Determinação</span>
                <span className="text-forest-600 font-medium">
                  {formatarData(especime.data_determinacao)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* D. Descrição da ocorrência */}
        {especime.descricao_ocorrencia && (
          <div className="mb-12 space-y-4 text-left">
            <h2 className="text-xl font-bold text-forest-900">Descrição da Ocorrência</h2>
            <div className="text-forest-600 text-sm leading-relaxed space-y-4 font-normal">
              {especime.descricao_ocorrencia.split('\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {/* E. Localização no campo */}
        {especime.detalhes_localizacao && (
          <div className="mb-12 space-y-4 text-left">
            <h2 className="text-xl font-bold text-forest-900">Localização no Campo</h2>
            <p className="text-forest-600 text-sm leading-relaxed font-normal whitespace-pre-line">
              {especime.detalhes_localizacao}
            </p>
          </div>
        )}

        {/* F. Mapa do espécime */}
        {(especime.latitude !== null && especime.longitude !== null) && (
          <section className="mb-12 pt-10 border-t border-forest-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
                📍 Localização Geográfica
              </h2>
              <a
                href={`https://www.google.com/maps?q=${especime.latitude},${especime.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-forest-400 hover:text-forest-500 transition-colors"
              >
                Ver no Google Maps ↗
              </a>
            </div>

            <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-forest-200 shadow-xs relative z-0">
              <MapContainer
                center={[especime.latitude, especime.longitude]}
                zoom={17}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <CircleMarker
                  center={[especime.latitude, especime.longitude]}
                  radius={8}
                  color={SPECIMEN_MARKER_COLOR}
                  fillColor={SPECIMEN_MARKER_COLOR}
                  fillOpacity={0.8}
                  weight={2}
                  stroke
                >
                  <Popup>
                    <div className="text-left font-sans text-xs">
                      <strong className="font-mono">{especime.tombo_codigo || `#${especime.id}`}</strong>
                      <div className="italic text-forest-900 mt-0.5">{especie.nome_cientifico}</div>
                    </div>
                  </Popup>
                </CircleMarker>
                <MapBoundsUpdater pontos={[{ latitude: especime.latitude, longitude: especime.longitude }]} />
              </MapContainer>
            </div>
          </section>
        )}

        {/* G. Morfologia e Habitat */}
        {(especime.morfologia || especime.habitat_ecologia) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 pt-10 border-t border-forest-200 text-left">
            {especime.morfologia && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-forest-900">Morfologia</h2>
                <p className="text-forest-600 text-sm leading-relaxed font-normal whitespace-pre-line">
                  {especime.morfologia}
                </p>
              </div>
            )}
            {especime.habitat_ecologia && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-forest-900">Habitat / Ecologia</h2>
                <p className="text-forest-600 text-sm leading-relaxed font-normal whitespace-pre-line">
                  {especime.habitat_ecologia}
                </p>
              </div>
            )}
          </div>
        )}

        {/* H. Galeria de imagens */}
        <div className="pt-10 border-t border-forest-200">
          {imagens.length > 0 ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <h2 className="text-xl font-bold text-forest-900">
                  Galeria de Imagens do Espécime
                </h2>
                <span className="inline-flex px-2.5 py-1 bg-forest-100 border border-forest-200 text-forest-600 text-xs font-bold rounded-lg">
                  {imagens.length} {imagens.length === 1 ? 'imagem' : 'imagens'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {imagens.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-forest-200 bg-stone-50 hover:brightness-90 transition duration-300"
                    onClick={() => setGalleryLightboxIndex(idx)}
                  >
                    <img
                      src={img.url_thumbnail || img.url_imagem || undefined}
                      alt={especie.nome_popular || especie.nome_cientifico}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-forest-200 shadow-xs flex flex-col items-center justify-center">
              <Leaf size={40} className="text-neutral-300 mb-2 animate-pulse" />
              <p className="text-sm text-neutral-500 italic">
                Nenhuma imagem cadastrada para este espécime.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Lightbox da Galeria (createPortal z-[100]) */}
      {galleryLightboxIndex !== null && (
        galleryLightboxIndex >= 0 && galleryLightboxIndex < imagens.length
      ) && createPortal(
        <div
          className="fixed inset-0 bg-black/92 flex items-center justify-center z-[100]"
          onClick={() => setGalleryLightboxIndex(null)}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-neutral-300 transition-colors p-2 cursor-pointer bg-black/40 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setGalleryLightboxIndex(null);
            }}
            aria-label="Fechar galeria"
          >
            <X size={28} />
          </button>

          {imagens.length > 1 && (
            <>
              <button
                onClick={prevGalleryImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center text-3xl font-bold shadow-md cursor-pointer transition-all z-10 select-none border border-white/20"
              >
                ‹
              </button>
              <button
                onClick={nextGalleryImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center text-3xl font-bold shadow-md cursor-pointer transition-all z-10 select-none border border-white/20"
              >
                ›
              </button>
            </>
          )}

          <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={imagens[galleryLightboxIndex].url_imagem || undefined}
              alt="Imagem do local ampliada"
              className="max-h-[80vh] max-w-[85vw] object-contain rounded-lg select-none"
            />
            {imagens[galleryLightboxIndex]?.creditos && (
              <div className="w-full mt-3 pt-3 border-t border-white/20 text-center">
                <span className="text-xs text-white/70">
                  {imagens[galleryLightboxIndex].creditos}
                </span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
