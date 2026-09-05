import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Leaf, Info, ShieldAlert, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Leaflet
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import { MapBoundsUpdater } from './components/MapBoundsUpdater';
import { SpecimenPopupCard } from './components/SpecimenPopupCard';
import { createDotIcon, createClusterIcon } from './components/mapMarkerIcons';

interface SpeciesImage {
  id?: string;
  url_imagem: string;
  url_thumbnail: string | null;
  url_micro?: string | null;
  creditos?: string | null;
}

interface SpeciesDetails {
  id: string;
  nome_cientifico: string;
  autor: string | null;
  nome_popular: string | null;
  familia_id: string;
  codigo_vs: string | null;
  descricao_especie: string | null;
  cuidados_luz: string | null;
  cuidados_agua: string | null;
  cuidados_temperatura: string | null;
  cuidados_substrato: string | null;
  cuidados_nutrientes: string | null;
  familia: {
    id: string;
    familia_nome: string;
  } | null;
  imagens: SpeciesImage[] | null;
}

interface GalleryImageItem {
  id?: string;
  especime_id: number | null;
  url_thumbnail: string | null;
  url_micro: string | null;
  url_imagem: string;
  creditos: string | null;
}

interface MapSpecimenItem {
  id: number;
  latitude: number;
  longitude: number;
  detalhes_localizacao: string | null;
  descricao_ocorrencia: string | null;
  coletor: string | null;
  tombo_codigo: string | null;
  tombo_num: number | null;
  local_id: number | null;
}

interface LocalNameItem {
  id: number;
  nome: string;
}

export default function DetalhesEspecie() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const localIdParam = searchParams.get('local_id') || searchParams.get('local');
  const navigate = useNavigate();

  const [species, setSpecies] = useState<SpeciesDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados do Carrossel e do Lightbox da Galeria
  const [currentIndex, setCurrentIndex] = useState(0);
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState<number | null>(null);

  const [especimes, setEspecimes] = useState<MapSpecimenItem[]>([]);
  const [localNomeMap, setLocalNomeMap] = useState<Record<number, string>>({});
  const [imagensCarrossel, setImagensCarrossel] = useState<Array<{ src: string; creditos: string | null }>>([]);
  const [galeriaCompleta, setGaleriaCompleta] = useState<GalleryImageItem[]>([]);

  const montarImagensEspecie = async (especieId: string) => {
    // Passo 1: buscar todos os espécimes desta espécie
    const { data: especimes } = await supabase
      .from('especie_local')
      .select('id')
      .eq('especie_id', especieId)
      .order('id', { ascending: true });

    const todosEspecimeIds = (especimes ?? []).map(e => e.id);

    // ── GALERIA: todas as imagens Tipo B, sem limite ──────────
    let galeria: GalleryImageItem[] = [];
    if (todosEspecimeIds.length > 0) {
      const { data: tipoB } = await supabase
        .from('imagens')
        .select('id, especime_id, url_thumbnail, url_micro, url_imagem, creditos')
        .in('especime_id', todosEspecimeIds)
        .is('especie_id', null)
        .not('url_thumbnail', 'is', null)
        .order('especime_id', { ascending: true })
        .order('created_at', { ascending: true });
      galeria = tipoB ?? [];
    }
    setGaleriaCompleta(galeria);

    // ── CARROSSEL: 1 imagem por espécime, máx 3 ──────────────
    let carrossel: Array<{ src: string; creditos: string | null }> = [];

    if (todosEspecimeIds.length > 0) {
      const { data: tipoBCarrossel } = await supabase
        .from('imagens')
        .select('especime_id, url_thumbnail, creditos')
        .in('especime_id', todosEspecimeIds)
        .is('especie_id', null)
        .not('url_thumbnail', 'is', null)
        .order('especime_id', { ascending: true })
        .order('created_at', { ascending: true });

      // 1 por especime_id, máx 3
      const visto = new Set<number>();
      for (const img of (tipoBCarrossel ?? [])) {
        if (visto.size >= 3) break;
        if (img.especime_id && !visto.has(img.especime_id)) {
          visto.add(img.especime_id);
          carrossel.push({
            src: img.url_thumbnail,
            creditos: img.creditos ?? null
          });
        }
      }
    }

    // Fallback: sem espécimes → usar Tipo A (imagem global)
    if (carrossel.length === 0) {
      const { data: tipoA } = await supabase
        .from('imagens')
        .select('url_thumbnail, creditos')
        .eq('especie_id', especieId)
        .is('especie_id', null)
        .not('url_thumbnail', 'is', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (tipoA?.url_thumbnail) {
        carrossel = [{ src: tipoA.url_thumbnail, creditos: tipoA.creditos ?? null }];
      }
    }

    setImagensCarrossel(carrossel);
  };

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data: speciesData, error: speciesError } = await supabase
        .from('especie')
        .select(`
          id,
          nome_cientifico,
          autor,
          nome_popular,
          familia_id,
          descricao_especie,
          cuidados_luz,
          cuidados_agua,
          cuidados_temperatura,
          cuidados_substrato,
          cuidados_nutrientes,
          familia:familia_id (id, familia_nome)
        `)
        .eq('id', id)
        .single();

      if (speciesError) throw speciesError;

      // Se acessado no contexto de um local/projeto, verificar override
      let overrideDescricao: string | null = null;
      if (localIdParam) {
        const { data: overrideData } = await supabase
          .from('especie_local_overrides')
          .select('descricao_especie')
          .eq('especie_id', id)
          .eq('local_id', localIdParam)
          .maybeSingle();

        if (overrideData?.descricao_especie) {
          overrideDescricao = overrideData.descricao_especie;
        }
      }

      // Montar carrossel e galeria com a nova lógica definitiva
      await montarImagensEspecie(id);

      // Setar dados da espécie (imagens serão preenchidas pelo estado galeriaCompleta)
      setSpecies({
        ...(speciesData as unknown as Omit<SpeciesDetails, 'imagens'>),
        descricao_especie: overrideDescricao ?? speciesData.descricao_especie,
        imagens: null
      });
      setCurrentIndex(0);

      // Buscar espécimes desta espécie com coordenadas para o mapa
      const { data: especimesLocalData, error: especimesLocalError } = await supabase
        .from('especie_local')
        .select('id, latitude, longitude, detalhes_localizacao, descricao_ocorrencia, coletor, tombo_codigo, tombo_num, local_id')
        .eq('especie_id', id)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (especimesLocalError) throw especimesLocalError;

      // Buscar nomes dos locais para os popups
      const localIds = [...new Set((especimesLocalData ?? []).map(e => e.local_id).filter(Boolean))];
      let locaisData: LocalNameItem[] = [];
      if (localIds.length > 0) {
        const { data, error: locaisError } = await supabase
          .from('locais')
          .select('id, nome')
          .in('id', localIds);

        if (locaisError) throw locaisError;
        locaisData = data ?? [];
      }

      // Mapa id → nome do local
      const tempLocalNomeMap: Record<number, string> = {};
      for (const l of locaisData) {
        tempLocalNomeMap[l.id] = l.nome;
      }

      setEspecimes(especimesLocalData ?? []);
      setLocalNomeMap(tempLocalNomeMap);

    } catch (err) {
      console.error('Erro ao buscar detalhes da espécie:', err);
      const error = err as { message?: string };
      setError(error.message || 'Ocorreu um erro ao carregar os detalhes da espécie.');
    } finally {
      setLoading(false);
    }
  }, [id, localIdParam]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Mapa especime_id → imagem específica daquele espécime (para os balões do mapa)
  const imagemPorEspecime = useMemo(() => {
    const map: Record<number, string | null> = {};
    for (const img of galeriaCompleta) {
      if (img.especime_id && !map[img.especime_id]) {
        map[img.especime_id] = img.url_micro || img.url_thumbnail || null;
      }
    }
    return map;
  }, [galeriaCompleta]);

  // Auto-avanço de 5 segundos no carrossel de topo
  useEffect(() => {
    if (imagensCarrossel.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % imagensCarrossel.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [imagensCarrossel.length]);

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + imagensCarrossel.length) % imagensCarrossel.length);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % imagensCarrossel.length);
  };

  const prevGalleryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryLightboxIndex !== null) {
      setGalleryLightboxIndex(prev =>
        prev !== null ? (prev - 1 + galeriaCompleta.length) % galeriaCompleta.length : null
      );
    }
  };

  const nextGalleryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryLightboxIndex !== null) {
      setGalleryLightboxIndex(prev =>
        prev !== null ? (prev + 1) % galeriaCompleta.length : null
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-800">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-neutral-600 font-medium text-sm animate-pulse">Carregando informações da espécie...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !species) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-800">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-20 px-6 text-center">
          <ShieldAlert className="text-red-500 w-16 h-16 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-neutral-900">Espécie não encontrada</h2>
          <p className="text-neutral-600 mt-2 max-w-sm text-sm">
            {error || 'O registro taxonômico que você tentou acessar não foi localizado ou foi removido.'}
          </p>
          <button
            onClick={() => navigate('/catalogo')}
            className="mt-6 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm"
          >
            Voltar para o Catálogo
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-800">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl text-left">
        {/* A. Botão voltar (linha com dois elementos) */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => {
              if (species.familia_id) {
                navigate(`/familias-catalogo/${species.familia_id}`);
              } else {
                navigate('/familias-catalogo');
              }
            }}
            className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <span>
              {species.familia?.familia_nome
                ? `← Voltar para ${species.familia.familia_nome}`
                : '← Voltar para Famílias'}
            </span>
          </button>

          {species.familia && (
            <Link
              to={`/familias-catalogo/${species.familia.id}`}
              className="text-xs bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors rounded-full px-3 py-1 font-semibold"
            >
              Família: {species.familia.familia_nome}
            </Link>
          )}
        </div>

        {/* B. Carrossel de imagens (TOPO) */}
        {imagensCarrossel.length > 0 ? (
          <div className="w-full h-[480px] rounded-2xl overflow-hidden relative mb-8 bg-neutral-600 shadow-xs">
            <img
              src={imagensCarrossel[currentIndex]?.src}
              alt={species.nome_popular || species.nome_cientifico}
              className="object-cover w-full h-full select-none"
            />

            {imagensCarrossel.length > 1 && (
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
                  {imagensCarrossel.map((_, index) => (
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

            {imagensCarrossel[currentIndex]?.creditos && (
              <span className="absolute bottom-4 right-4 text-xs text-white/60 bg-black/40 px-3 py-1 rounded-full pointer-events-none select-none z-10">
                {imagensCarrossel[currentIndex].creditos}
              </span>
            )}
          </div>
        ) : (
          <div className="w-full h-[400px] bg-forest-800 rounded-2xl flex flex-col items-center justify-center text-white mb-8 shadow-xs">
            <Leaf size={64} className="text-forest-400 mb-2 animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-wider text-forest-400/80">Sem imagens de referência</span>
          </div>
        )}

        {/* C. Header da espécie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-12">
          {/* Coluna Esquerda: Nomenclatura */}
          <div className="md:col-span-2 space-y-3">
            <h1 className="text-3xl font-bold text-forest-900 flex items-baseline gap-2 flex-wrap leading-tight">
              <span className="italic font-serif">{species.nome_cientifico}</span>
              {species.autor && (
                <span className="text-sm text-neutral-500 font-normal font-sans block sm:inline sm:ml-2">
                  {species.autor}
                </span>
              )}
            </h1>
            {species.nome_popular && (
              <h2 className="text-base font-medium text-forest-400 capitalize">
                {species.nome_popular}
              </h2>
            )}
          </div>

          {/* Coluna Direita: Resumo Taxonômico */}
          <div className="bg-forest-100 rounded-2xl border border-forest-200 p-5 text-xs text-left space-y-3">
            <h3 className="font-bold text-forest-900 text-sm pb-2 border-b border-forest-200 flex items-center gap-1.5">
              <Info size={14} className="text-forest-600" />
              Resumo Taxonômico
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-neutral-500">Família</span>
                {species.familia ? (
                  <Link
                    to={`/familias-catalogo/${species.familia.id}`}
                    className="font-bold text-forest-900 hover:underline"
                  >
                    {species.familia.familia_nome}
                  </Link>
                ) : (
                  <span className="text-neutral-400">Não associada</span>
                )}
              </div>

              <div className="flex justify-between items-center py-1 border-t border-forest-200/40">
                <span className="font-semibold text-neutral-500">Autor</span>
                <span className="text-forest-600 font-medium text-right max-w-[150px] truncate" title={species.autor || ''}>
                  {species.autor || 'Não informado'}
                </span>
              </div>

              {species.codigo_vs && (
                <div className="flex justify-between items-center py-1 border-t border-forest-200/40">
                  <span className="font-semibold text-neutral-500">Código VS</span>
                  <span className="text-forest-600 font-mono font-bold bg-white px-2 py-0.5 rounded border border-forest-200">
                    {species.codigo_vs}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* D. Descrição Botânica */}
        {species.descricao_especie && (
          <div className="mb-12 space-y-4">
            <h2 className="text-xl font-bold text-forest-900">Descrição Botânica</h2>
            <div className="text-forest-600 text-sm leading-relaxed space-y-4 font-normal">
              {species.descricao_especie.split('\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {/* Mapa de ocorrências registradas */}
        {especimes.length > 0 && (
          <section className="mt-10 mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
                📍 Ocorrências Registradas
              </h2>
              <span className="text-sm text-neutral-500">
                {especimes.length} registro{especimes.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="h-[380px] w-full rounded-2xl overflow-hidden border border-forest-200 shadow-xs relative z-0">
              <MapContainer
                center={[-22.74, -43.70]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MarkerClusterGroup iconCreateFunction={createClusterIcon} maxClusterRadius={50} spiderfyOnMaxZoom>
                  {especimes.map(ponto => (
                    <Marker
                      key={ponto.id}
                      position={[ponto.latitude, ponto.longitude]}
                      icon={createDotIcon()}
                    >
                      <Popup maxWidth={260} autoPan={false}>
                        <SpecimenPopupCard
                          imagemUrl={imagemPorEspecime[ponto.id] || imagensCarrossel[0]?.src || null}
                          nomeCientifico={species?.nome_cientifico}
                          nomePopular={species?.nome_popular}
                          familiaNome={species?.familia?.familia_nome}
                          localNome={ponto.local_id ? localNomeMap[ponto.local_id] : null}
                          tombo={ponto.tombo_codigo}
                        />
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
                <MapBoundsUpdater pontos={especimes} />
              </MapContainer>
            </div>
          </section>
        )}

        {/* F. Galeria Botânica — REFORMULAR */}
        <div className="pt-10 border-t border-forest-200">
          {galeriaCompleta.length > 0 ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <h2 className="text-xl font-bold text-forest-900">
                  Galeria Botânica da Espécie
                </h2>
                <span className="inline-flex px-2.5 py-1 bg-forest-100 border border-forest-200 text-forest-600 text-xs font-bold rounded-lg">
                  {galeriaCompleta.length} {galeriaCompleta.length === 1 ? 'foto' : 'fotos'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {galeriaCompleta.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-forest-200 bg-stone-50 hover:brightness-90 transition duration-300"
                    onClick={() => setGalleryLightboxIndex(idx)}
                  >
                    <img
                      src={img.url_thumbnail || img.url_imagem}
                      alt={species.nome_popular || species.nome_cientifico}
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
                Nenhuma imagem de espécime cadastrada ainda.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Lightbox da Galeria (createPortal z-[100]) */}
      {galleryLightboxIndex !== null && (
        galleryLightboxIndex >= 0 && galleryLightboxIndex < galeriaCompleta.length
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

          {galeriaCompleta.length > 1 && (
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
              src={galeriaCompleta[galleryLightboxIndex].url_imagem}
              alt={species.nome_popular || species.nome_cientifico}
              className="max-h-[80vh] max-w-[85vw] object-contain rounded-lg select-none"
            />
            {galeriaCompleta[galleryLightboxIndex]?.creditos && (
              <div className="w-full mt-3 pt-3 border-t border-white/20 text-center">
                <span className="text-xs text-white/70">
                  {galeriaCompleta[galleryLightboxIndex].creditos}
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
