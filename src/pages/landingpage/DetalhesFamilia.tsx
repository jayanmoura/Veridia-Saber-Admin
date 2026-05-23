import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Leaf, Info, ShieldAlert, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Leaflet
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { MapBoundsUpdater } from './components/MapBoundsUpdater';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

interface FamilyDetails {
  id: string;
  familia_nome: string;
  autoria_taxonomica: string | null;
  caracteristicas: string | null;
  descricao_familia: string | null;
  imagem_referencia: string | null;
  imagem_thumbnail: string | null;
  imagem_micro: string | null;
  distribuicao_geografica: string | null;
}

interface SpeciesListItem {
  id: string;
  nome_cientifico: string;
  nome_popular: string | null;
  codigo_vs: string | null;
}

export default function DetalhesFamilia() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [family, setFamily] = useState<FamilyDetails | null>(null);
  const [species, setSpecies] = useState<SpeciesListItem[]>([]);
  const [imagens, setImagens] = useState<any[]>([]);
  const [especimesMap, setEspecimesMap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados do Carrossel e Lightbox
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const [imagensCarrossel, setImagensCarrossel] = useState<Array<{ src: string; creditos: string | null }>>([]);

  // Estado de busca local e filtros de mapa
  const [searchEspecie, setSearchEspecie] = useState('');
  const [especieFiltro, setEspecieFiltro] = useState<string>('todas');

  // Pontos filtrados para o mapa
  const pontosFiltrados = useMemo(() => {
    return especieFiltro === 'todas'
      ? especimesMap
      : especimesMap.filter(e => e.especie_id === especieFiltro);
  }, [especimesMap, especieFiltro]);

  // Espécies que têm ao menos 1 ponto georreferenciado (para popular o dropdown)
  const especiesComPontos = useMemo(() => {
    return species.filter(esp =>
      especimesMap.some(p => p.especie_id === esp.id)
    );
  }, [species, especimesMap]);

  useEffect(() => {
    if (!id) return;

    const fetchTudo = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query 1: dados da família
        const { data: familyData, error: familyError } = await supabase
          .from('familia')
          .select('id, familia_nome, descricao_familia, caracteristicas, autoria_taxonomica, distribuicao_geografica, imagem_thumbnail, imagem_referencia, imagem_micro')
          .eq('id', id)
          .single();

        if (familyError) throw familyError;

        // Query 2: espécies da família
        const { data: speciesData, error: speciesError } = await supabase
          .from('especie')
          .select('id, nome_cientifico, nome_popular, codigo_vs')
          .eq('familia_id', id)
          .order('nome_cientifico', { ascending: true });

        if (speciesError) throw speciesError;

        const especiesResult = (speciesData || []) as SpeciesListItem[];
        const especieIds = especiesResult.map(e => e.id);

        // Query 3: imagens de todas as espécies desta família (grid das espécies nos cards)
        let imagensResult: any[] = [];
        if (especieIds.length > 0) {
          // Imagens Tipo A: especie_id preenchido
          const { data: imgData, error: imgError } = await supabase
            .from('imagens')
            .select('id, especie_id, especime_id, url_thumbnail, url_micro, url_imagem, creditos')
            .in('especie_id', especieIds)
            .not('url_thumbnail', 'is', null);

          if (imgError) throw imgError;
          const imagensEspecie = imgData ?? [];

          // Espécimes vinculados a essas espécies
          const { data: especimes, error: especimesError } = await supabase
            .from('especie_local')
            .select('id, especie_id')
            .in('especie_id', especieIds);

          if (especimesError) throw especimesError;

          const especimeIds = (especimes ?? []).map(e => e.id);

          // Imagens Tipo B: especime_id preenchido
          let imagensEspecime: any[] = [];
          if (especimeIds.length > 0) {
            const { data: imgEspecimeData, error: imgEspecimeError } = await supabase
              .from('imagens')
              .select('id, especie_id, especime_id, url_thumbnail, url_micro, url_imagem, creditos')
              .in('especime_id', especimeIds)
              .not('url_thumbnail', 'is', null);

            if (imgEspecimeError) throw imgEspecimeError;
            imagensEspecime = imgEspecimeData ?? [];
          }

          // Enriquecer Tipo B com especie_id correto
          const especimeParaEspecie: Record<number, string> = {};
          for (const esp of (especimes ?? [])) {
            especimeParaEspecie[esp.id] = esp.especie_id;
          }

          const imagensEspecimeEnriquecidas = imagensEspecime.map(img => ({
            ...img,
            especie_id: img.especie_id || especimeParaEspecie[img.especime_id] || null
          }));

          // Combinar sem duplicatas por id
          const mapaIdImagens = new Map<string, any>();
          for (const img of imagensEspecie) mapaIdImagens.set(img.id, img);
          for (const img of imagensEspecimeEnriquecidas) {
            if (!mapaIdImagens.has(img.id)) mapaIdImagens.set(img.id, img);
          }
          imagensResult = Array.from(mapaIdImagens.values());
        }

        // Query 4: espécimes com coordenadas para o mapa
        let especimesMapResult: any[] = [];
        if (especieIds.length > 0) {
          const { data: especimesMapData, error: especimesMapError } = await supabase
            .from('especie_local')
            .select('id, latitude, longitude, detalhes_localizacao, descricao_ocorrencia, coletor, especie_id, tombo_codigo, tombo_num')
            .in('especie_id', especieIds)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

          if (especimesMapError) throw especimesMapError;
          especimesMapResult = especimesMapData || [];
        }

        let carrossel: Array<{ src: string; creditos: string | null }> = [];

        if (especieIds.length > 0) {
          // Buscar todos os espécimes das espécies desta família
          const { data: todosEspecimes, error: todosEspecimesError } = await supabase
            .from('especie_local')
            .select('id')
            .in('especie_id', especieIds);

          if (todosEspecimesError) throw todosEspecimesError;

          const todosEspecimeIds = (todosEspecimes ?? []).map(e => e.id);

          if (todosEspecimeIds.length > 0) {
            const { data: tipoB, error: tipoBError } = await supabase
              .from('imagens')
              .select('especime_id, url_thumbnail, creditos')
              .in('especime_id', todosEspecimeIds)
              .filter('especie_id', 'is', null)
              .not('url_thumbnail', 'is', null);

            if (tipoBError) throw tipoBError;

            // Embaralhar aleatoriamente (Fisher-Yates shuffle)
            const imgs = [...(tipoB ?? [])];
            for (let i = imgs.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
            }

            carrossel = imgs.map(img => ({
              src: img.url_thumbnail,
              creditos: img.creditos ?? null
            }));
          }
        }

        setFamily(familyData);
        setSpecies(especiesResult);
        setImagens(imagensResult);
        setEspecimesMap(especimesMapResult);
        setImagensCarrossel(carrossel);
        setCurrentIndex(0);
      } catch (err: any) {
        console.error('Erro ao buscar dados de detalhes da família:', err);
        setError(err.message || 'Ocorreu um erro ao carregar as informações.');
      } finally {
        setLoading(false);
      }
    };

    fetchTudo();
  }, [id]);

  // Montar mapa especie_id → primeira imagem (para cards)
  const imagemPorEspecie = useMemo(() => {
    const map: Record<string, { micro: string | null; thumbnail: string | null; original: string | null }> = {};
    for (const img of imagens) {
      if (!map[img.especie_id]) {
        map[img.especie_id] = {
          micro: img.url_micro,
          thumbnail: img.url_thumbnail,
          original: img.url_imagem
        };
      }
    }
    return map;
  }, [imagens]);

  const lightboxCredito = useMemo(() => {
    if (!lightboxSrc) return null;
    return imagensCarrossel.find(img => img.src === lightboxSrc)?.creditos || null;
  }, [lightboxSrc, imagensCarrossel]);

  // Auto-avanço de 5 segundos no carrossel
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



  // Filtragem local de espécies
  const especiesFiltradas = useMemo(() => {
    return species.filter(e =>
      e.nome_cientifico.toLowerCase().includes(searchEspecie.toLowerCase()) ||
      (e.nome_popular ?? '').toLowerCase().includes(searchEspecie.toLowerCase())
    );
  }, [species, searchEspecie]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8faf6] text-stone-850">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-[#5fcf6e] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#4a7c5a] font-medium text-sm animate-pulse">Carregando detalhes da família...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8faf6] text-stone-850">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-20 px-6 text-center">
          <ShieldAlert className="text-red-500 w-16 h-16 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-[#1a3a1f]">Família botânica não encontrada</h2>
          <p className="text-[#4a7c5a] mt-2 max-w-sm text-sm">
            {error || 'A família que você tentou acessar não foi localizada ou foi removida do sistema de referência.'}
          </p>
          <button
            onClick={() => navigate('/familias-catalogo')}
            className="mt-6 px-6 py-3 bg-[#1a3a1f] hover:bg-[#2d5a3d] text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm"
          >
            Voltar para Famílias
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
        {/* A. Botão voltar */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/familias-catalogo')}
            className="flex items-center gap-2 text-sm font-semibold text-[#4a7c5a] hover:text-[#1a3a1f] transition-colors cursor-pointer"
          >
            <span>← Voltar para Famílias</span>
          </button>
        </div>

        {/* C. Carrossel de imagens (TOPO) */}
        {imagensCarrossel.length > 0 ? (
          <div className="w-full h-[480px] rounded-2xl overflow-hidden relative mb-8 bg-stone-100 shadow-xs">
            <img
              src={imagensCarrossel[currentIndex]?.src}
              alt={imagensCarrossel[currentIndex]?.creditos || family.familia_nome}
              className="object-cover w-full h-full select-none"
            />

            {imagensCarrossel.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-stone-850 hover:text-black w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-md cursor-pointer transition-all z-10 select-none"
                >
                  ‹
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-stone-850 hover:text-black w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-md cursor-pointer transition-all z-10 select-none"
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
          <div className="w-full h-[480px] bg-[#2d5a3d] rounded-2xl flex flex-col items-center justify-center text-white mb-8 shadow-xs">
            <Leaf size={64} className="text-[#5fcf6e] mb-2 animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-wider text-[#5fcf6e]/80">Sem imagens de referência</span>
          </div>
        )}

        {/* D. Header da família */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a3a1f] flex items-baseline gap-2 flex-wrap">
            <span>{family.familia_nome}</span>
            {family.autoria_taxonomica && (
              <span className="text-sm text-[#7a9a7a] font-normal">
                {family.autoria_taxonomica}
              </span>
            )}
          </h1>
        </div>

        {/* Informações detalhadas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-12">
          <div className="lg:col-span-2 space-y-8">
            {/* E. Descrição da Família */}
            {family.descricao_familia && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-[#1a3a1f]">Descrição da Família</h2>
                <div className="text-[#4a7c5a] text-sm leading-relaxed space-y-4 font-normal">
                  {family.descricao_familia.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* F. Características Botânicas */}
            {family.caracteristicas && family.caracteristicas !== family.descricao_familia && (
              <div className="space-y-3 pt-6 border-t border-[#dde8d5]">
                <h2 className="text-xl font-bold text-[#1a3a1f]">Características Botânicas</h2>
                <p className="text-[#4a7c5a] text-sm leading-relaxed font-normal whitespace-pre-line">
                  {family.caracteristicas}
                </p>
              </div>
            )}
          </div>

          {/* Dados rápidos / Distribuição */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#dde8d5] p-6 shadow-xs text-left">
              <h3 className="text-sm font-bold text-[#1a3a1f] mb-4 flex items-center gap-2">
                <Info size={16} className="text-[#5fcf6e]" />
                Resumo Taxonômico
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-stone-400 block mb-0.5">Família</span>
                  <span className="text-[#1a3a1f] font-bold text-sm">{family.familia_nome}</span>
                </div>

                {family.autoria_taxonomica && (
                  <div>
                    <span className="font-semibold text-stone-400 block mb-0.5">Autoria Taxonômica</span>
                    <span className="text-[#4a7c5a] font-medium">{family.autoria_taxonomica}</span>
                  </div>
                )}

                {family.distribuicao_geografica && (
                  <div className="pt-3 border-t border-[#dde8d5]">
                    <span className="font-semibold text-stone-400 block mb-0.5">Distribuição Geográfica</span>
                    <span className="text-[#4a7c5a] font-medium leading-relaxed block">
                      {family.distribuicao_geografica}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Mapa de ocorrências da família */}
        {(especimesMap ?? []).length > 0 && (
          <section className="mb-12 pt-10 border-t border-[#dde8d5]">
            {/* Header da seção */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1a3a1f] flex items-center gap-2">
                📍 Distribuição e Ocorrências
              </h2>

              {especiesComPontos.length > 1 && (
                <select
                  value={especieFiltro}
                  onChange={e => setEspecieFiltro(e.target.value)}
                  className="text-sm border border-[#dde8d5] rounded-lg px-3 py-2 bg-white text-[#1a3a1f] focus:outline-none focus:border-[#5fcf6e] cursor-pointer"
                >
                  <option value="todas">Todas as espécies</option>
                  {especiesComPontos.map(esp => {
                    const count = (especimesMap ?? []).filter(p => p.especie_id === esp.id).length;
                    return (
                      <option key={esp.id} value={esp.id}>
                        {esp.nome_cientifico} ({count})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Mapa Leaflet */}
            <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-[#dde8d5] shadow-xs relative z-0">
              <MapContainer
                center={[-22.74, -43.70]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {pontosFiltrados.map(ponto => {
                  const especie = species.find(e => e.id === ponto.especie_id);
                  return (
                    <Marker
                      key={ponto.id}
                      position={[ponto.latitude, ponto.longitude]}
                    >
                      <Popup>
                        <div style={{ minWidth: 180 }} className="text-left font-sans">
                          <strong className="italic text-[#1a3a1f]">
                            {especie?.nome_cientifico ?? 'Espécie'}
                          </strong>
                          {especie?.nome_popular && (
                            <div className="text-[#4a7c5a] text-xs font-semibold mt-0.5">
                              {especie.nome_popular}
                            </div>
                          )}
                          {ponto.tombo_codigo && (
                            <div className="text-stone-500 text-xs mt-1">
                              <strong>Tombo:</strong> {ponto.tombo_codigo}
                            </div>
                          )}
                          {ponto.descricao_ocorrencia && (
                            <div className="text-stone-600 text-xs mt-1 border-t border-stone-100 pt-1 leading-relaxed">
                              {ponto.descricao_ocorrencia}
                            </div>
                          )}
                          {ponto.detalhes_localizacao && (
                            <div className="text-stone-400 text-[10px] mt-1 leading-normal">
                              <strong>Localização:</strong> {ponto.detalhes_localizacao}
                            </div>
                          )}
                          {ponto.coletor && (
                            <div className="text-stone-400 text-[10px] mt-0.5">
                              <strong>Coletor:</strong> {ponto.coletor}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
                <MapBoundsUpdater pontos={pontosFiltrados} />
              </MapContainer>
            </div>

            {/* Legenda: total de registros visíveis */}
            <p className="text-xs text-[#7a9a7a] mt-3 font-medium">
              {pontosFiltrados.length} registro(s) de ocorrência exibido(s)
              {especieFiltro !== 'todas' && ` para ${species.find(e => e.id === especieFiltro)?.nome_cientifico}`}
            </p>
          </section>
        )}

        {/* G. Catálogo de espécies com busca interna */}
        <div className="pt-10 border-t border-[#dde8d5]">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-[#1a3a1f] flex items-center gap-2 flex-shrink-0">
              🌿 Espécies catalogadas nesta família
            </h2>

            <div className="flex items-center gap-3">
              <span className="text-sm bg-[#f0f5ee] text-[#4a7c5a] rounded-full px-3 py-1 flex-shrink-0">
                {species?.length ?? 0} espécie{(species?.length ?? 0) !== 1 ? 's' : ''}
              </span>

              <input
                type="text"
                value={searchEspecie}
                onChange={e => setSearchEspecie(e.target.value)}
                placeholder="Filtrar espécies..."
                className="text-sm border border-[#dde8d5] rounded-lg px-3 py-2 w-48 bg-white text-[#1a3a1f] placeholder-[#b0c8b0] focus:outline-none focus:border-[#5fcf6e]"
              />
            </div>
          </div>

          {species.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#dde8d5] shadow-xs">
              <Leaf size={40} className="mx-auto text-stone-300 mb-2 animate-pulse" />
              <p className="text-sm text-stone-500 italic">
                Nenhuma espécie catalogada nesta família ainda.
              </p>
            </div>
          ) : especiesFiltradas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#dde8d5] shadow-xs flex flex-col items-center justify-center">
              <Leaf size={40} className="text-[#7a9a7a] mb-2 animate-pulse" />
              <p className="text-sm text-stone-500 italic">
                Nenhuma espécie encontrada para '{searchEspecie}'.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {especiesFiltradas.map(especie => {
                const img = imagemPorEspecie[especie.id];
                const hasImg = img?.micro || img?.thumbnail;

                return (
                  <Link
                    to={`/catalogo/especie/${especie.id}`}
                    key={especie.id}
                    className="block bg-white rounded-2xl border border-[#dde8d5] overflow-hidden hover:shadow-md hover:border-[#5fcf6e] transition-all duration-200 cursor-pointer text-left"
                  >
                    {/* imagem */}
                    <div className="aspect-[4/3] overflow-hidden bg-[#2d5a3d]/10 relative">
                      {hasImg ? (
                        <img
                          src={img.micro || img.thumbnail || ''}
                          alt={especie.nome_cientifico}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#2d5a3d] text-white">
                          <span className="text-3xl" role="img" aria-label="Planta">🌿</span>
                        </div>
                      )}
                    </div>

                    {/* conteúdo textual — SEM badge da família */}
                    <div className="p-4">
                      <p className="font-semibold italic text-[#1a3a1f] truncate" title={especie.nome_cientifico}>
                        {especie.nome_cientifico}
                      </p>
                      {especie.nome_popular && (
                        <p className="text-sm text-[#4a7c5a] mt-1 truncate" title={especie.nome_popular}>
                          {especie.nome_popular}
                        </p>
                      )}
                      <p className="text-sm text-[#5fcf6e] mt-3 font-semibold">Ver detalhes →</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Lightbox (createPortal no document.body, z-[100]) */}
      {lightboxOpen && lightboxSrc && createPortal(
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]"
          onClick={() => {
            setLightboxOpen(false);
            setLightboxSrc(null);
          }}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-stone-300 transition-colors p-2 cursor-pointer bg-black/40 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
              setLightboxSrc(null);
            }}
            aria-label="Fechar galeria"
          >
            <X size={28} />
          </button>
          <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxSrc}
              alt="Ampliada"
              className="max-h-[80vh] max-w-[85vw] object-contain rounded-lg select-none"
            />
            {lightboxCredito && (
              <div className="w-full mt-3 pt-3 border-t border-white/20 text-center">
                <span className="text-xs text-white/70">{lightboxCredito}</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


