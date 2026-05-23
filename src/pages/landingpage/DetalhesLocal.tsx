import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

interface LocalDetails {
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
  historia: string | null;
  endereco: string | null;
  contato: string | null;
}

interface EspecimeItem {
  id: number;
  tombo_codigo: string | null;
  tombo_num: number | null;
  latitude: number | null;
  longitude: number | null;
  descricao_ocorrencia: string | null;
  detalhes_localizacao: string | null;
  coletor: string | null;
  data_determinacao: string | null;
  especie_id: string;
}

interface EspecieItem {
  id: string;
  nome_cientifico: string;
  nome_popular: string | null;
  familia_id: string | null;
  familia: {
    familia_nome: string;
  } | {
    familia_nome: string;
  }[] | null;
}

interface ImagemItem {
  id: string;
  especime_id: number | null;
  url_thumbnail: string | null;
  url_micro: string | null;
  url_imagem: string | null;
  creditos: string | null;
}

export default function DetalhesLocal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [local, setLocal] = useState<LocalDetails | null>(null);
  const [especimes, setEspecimes] = useState<EspecimeItem[]>([]);
  const [especies, setEspecies] = useState<EspecieItem[]>([]);
  const [galeria, setGaleria] = useState<ImagemItem[]>([]);
  const [imagemDaEspecie, setImagemDaEspecie] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados do Lightbox da Galeria
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState<number | null>(null);

  // Filtro de busca de espécies
  const [searchEspecie, setSearchEspecie] = useState('');

  // Novos estados para seleção de espécimes em modal
  const [modalEspecimes, setModalEspecimes] = useState<EspecimeItem[]>([]);
  const [modalEspecieNome, setModalEspecieNome] = useState<string>('');
  const [modalAberto, setModalAberto] = useState(false);
  const [imagemPorEspecime, setImagemPorEspecime] = useState<Record<number, string>>({});

  const fetchTudo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Dados do local
      const { data: localData, error: localError } = await supabase
        .from('locais')
        .select('id, nome, descricao, cidade, estado, tipo, sigla, imagem_capa, latitude, longitude, historia, endereco, contato')
        .eq('id', id)
        .single();

      if (localError) throw localError;

      // 2. Espécimes deste local com dados da espécie
      const { data: especimesData, error: especimesError } = await supabase
        .from('especie_local')
        .select('id, tombo_codigo, tombo_num, latitude, longitude, detalhes_localizacao, descricao_ocorrencia, coletor, data_determinacao, especie_id')
        .eq('local_id', id)
        .order('tombo_num', { ascending: true });

      if (especimesError) throw especimesError;

      const especimesResult = (especimesData ?? []) as EspecimeItem[];

      // 3. Espécies únicas deste local
      const especieIds = [...new Set(especimesResult.map(e => e.especie_id).filter(Boolean))];
      let especiesResult: EspecieItem[] = [];

      if (especieIds.length > 0) {
        const { data: espData, error: espError } = await supabase
          .from('especie')
          .select('id, nome_cientifico, nome_popular, familia_id, familia:familia_id(familia_nome)')
          .in('id', especieIds)
          .order('nome_cientifico', { ascending: true });

        if (espError) throw espError;
        especiesResult = (espData ?? []) as EspecieItem[];
      }

      // 4. Imagens dos espécimes deste local (para galeria)
      const especimeIds = especimesResult.map(e => e.id);
      let galeriaResult: ImagemItem[] = [];

      if (especimeIds.length > 0) {
        const { data: imgData, error: imgError } = await supabase
          .from('imagens')
          .select('id, especime_id, url_thumbnail, url_micro, url_imagem, creditos')
          .in('especime_id', especimeIds)
          .filter('especie_id', 'is', null)
          .not('url_thumbnail', 'is', null)
          .order('created_at', { ascending: true });

        if (imgError) throw imgError;
        galeriaResult = (imgData ?? []) as ImagemItem[];
      }

      // 5. Imagens Tipo A e B para os cards de espécie
      let imgEspeciesResult: Array<{
        id: string;
        especie_id: string | null;
        url_micro: string | null;
        url_thumbnail: string | null;
      }> = [];

      if (especieIds.length > 0) {
        const { data: imgEspData, error: imgEspError } = await supabase
          .from('imagens')
          .select('id, especie_id, url_micro, url_thumbnail')
          .in('especie_id', especieIds)
          .not('url_micro', 'is', null);

        if (imgEspError) throw imgEspError;
        imgEspeciesResult = (imgEspData ?? []) as typeof imgEspeciesResult;
      }

      const tempImagemDaEspecie: Record<string, string> = {};

      // Tipo A como fallback
      for (const img of imgEspeciesResult) {
        if (img.especie_id && !tempImagemDaEspecie[img.especie_id]) {
          tempImagemDaEspecie[img.especie_id] = img.url_micro || img.url_thumbnail || '';
        }
      }

      // Tipo B como preferencial (usando imagens da galeria deste local)
      const vistoTipoB = new Set<string>();
      for (const img of galeriaResult) {
        const esp = especimesResult.find(e => e.id === img.especime_id);
        if (esp && esp.especie_id && !vistoTipoB.has(esp.especie_id)) {
          vistoTipoB.add(esp.especie_id);
          tempImagemDaEspecie[esp.especie_id] = img.url_micro || img.url_thumbnail || '';
        }
      }

      const tempImagemPorEspecime: Record<number, string> = {};
      for (const img of galeriaResult) {
        if (img.especime_id && !tempImagemPorEspecime[img.especime_id]) {
          tempImagemPorEspecime[img.especime_id] = img.url_micro || img.url_thumbnail || '';
        }
      }

      setLocal(localData as LocalDetails);
      setEspecimes(especimesResult);
      setEspecies(especiesResult);
      setGaleria(galeriaResult);
      setImagemDaEspecie(tempImagemDaEspecie);
      setImagemPorEspecime(tempImagemPorEspecime);
    } catch (err) {
      console.error('Erro ao buscar dados do local:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao carregar as informações do local.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTudo();
  }, [fetchTudo]);

  const prevGalleryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryLightboxIndex !== null) {
      setGalleryLightboxIndex(prev =>
        prev !== null ? (prev - 1 + galeria.length) % galeria.length : null
      );
    }
  };

  const nextGalleryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryLightboxIndex !== null) {
      setGalleryLightboxIndex(prev =>
        prev !== null ? (prev + 1) % galeria.length : null
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8faf6] text-stone-850">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-[#5fcf6e] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#4a7c5a] font-medium text-sm animate-pulse">Carregando detalhes do local...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !local) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8faf6] text-stone-850">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-20 px-6 text-center">
          <ShieldAlert className="text-red-500 w-16 h-16 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-[#1a3a1f]">Local não encontrado</h2>
          <p className="text-[#4a7c5a] mt-2 max-w-sm text-sm">
            {error || 'O local que você tentou acessar não foi localizado ou foi removido do sistema de referência.'}
          </p>
          <button
            onClick={() => navigate('/locais-publico')}
            className="mt-6 px-6 py-3 bg-[#1a3a1f] hover:bg-[#2d5a3d] text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm"
          >
            Voltar para Locais
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const totalFamilias = [...new Set(
    especies.map(e => e.familia_id).filter(Boolean)
  )].length;
  const totalEspecies = especies.length;

  const especiesFiltradas = especies.filter(e =>
    e.nome_cientifico.toLowerCase().includes(searchEspecie.toLowerCase()) ||
    (e.nome_popular ?? '').toLowerCase().includes(searchEspecie.toLowerCase())
  );

  // Ao montar os dados, criar mapa especie_id → TODOS os especimes daquela espécie
  const especimesPorEspecie: Record<string, EspecimeItem[]> = {};
  for (const esp of (especimes ?? [])) {
    if (!especimesPorEspecie[esp.especie_id]) {
      especimesPorEspecie[esp.especie_id] = [];
    }
    especimesPorEspecie[esp.especie_id].push(esp);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf6] text-stone-850">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl text-left">
        {/* A. Botão voltar */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/locais-publico')}
            className="flex items-center gap-2 text-sm font-semibold text-[#4a7c5a] hover:text-[#1a3a1f] transition-colors cursor-pointer bg-transparent border-none outline-none"
          >
            <span>← Voltar para Locais</span>
          </button>
        </div>

        {/* B. Header / Imagem de Capa */}
        {local.imagem_capa ? (
          <div className="w-full h-[320px] rounded-2xl overflow-hidden mb-6 shadow-xs bg-stone-100">
            <img
              src={local.imagem_capa}
              alt={local.nome}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-[200px] bg-[#1a3a1f] rounded-2xl flex items-center justify-center text-white mb-6 p-6 text-center shadow-xs">
            <h1 className="text-2xl sm:text-3xl font-bold max-w-lg">{local.nome}</h1>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mt-6 mb-12">
          {/* Coluna esquerda: nome, badges, stats, sobre */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-[#1a3a1f]">{local.nome}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#f0f5ee] text-[#4a7c5a]">
                  {local.tipo || 'Geral'}
                </span>
                {local.sigla && (
                  <span className="text-xs text-[#4a7c5a] font-mono font-bold bg-white border border-[#dde8d5] px-2 py-0.5 rounded">
                    {local.sigla}
                  </span>
                )}
              </div>
            </div>

            {/* Stats pills */}
            <div className="flex gap-4 flex-wrap mt-4">
              <div className="bg-[#f0f5ee] rounded-xl px-4 py-3 text-center min-w-[80px]">
                <div className="text-2xl font-bold text-[#5fcf6e]">{totalFamilias}</div>
                <div className="text-xs text-[#7a9a7a] uppercase tracking-wide">Famílias</div>
              </div>
              <div className="bg-[#f0f5ee] rounded-xl px-4 py-3 text-center min-w-[80px]">
                <div className="text-2xl font-bold text-[#5fcf6e]">{totalEspecies}</div>
                <div className="text-xs text-[#7a9a7a] uppercase tracking-wide">Espécies</div>
              </div>
            </div>

            {/* Sobre, história, endereço e contato */}
            {local.descricao && (
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#1a3a1f]">Sobre o Local</h2>
                <p className="text-[#4a7c5a] text-sm leading-relaxed whitespace-pre-line font-normal">
                  {local.descricao}
                </p>
              </div>
            )}

            {local.historia && (
              <div className="space-y-2 pt-6 border-t border-[#dde8d5]">
                <h2 className="text-xl font-bold text-[#1a3a1f]">História</h2>
                <p className="text-[#4a7c5a] text-sm leading-relaxed whitespace-pre-line font-normal">
                  {local.historia}
                </p>
              </div>
            )}

            {(local.endereco || local.contato || local.cidade || local.estado) && (
              <div className="space-y-3 pt-6 border-t border-[#dde8d5]">
                <h2 className="text-xl font-bold text-[#1a3a1f]">Endereço & Contato</h2>
                <div className="text-sm text-[#4a7c5a] space-y-3 font-normal">
                  {local.endereco && (
                    <p><strong>Endereço:</strong> {local.endereco}</p>
                  )}
                  {local.contato && (
                    <p><strong>Contato:</strong> {local.contato}</p>
                  )}
                  {(local.cidade || local.estado) && (
                    <p><strong>Localidade:</strong> {local.cidade && local.estado ? `${local.cidade} - ${local.estado}` : local.cidade || local.estado}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Coluna direita: card Resumo do Local */}
          <div className="bg-[#f0f5ee] rounded-2xl border border-[#dde8d5] p-6 text-xs text-left space-y-4 shadow-xs">
            <h3 className="font-bold text-[#1a3a1f] text-sm pb-2 border-b border-[#dde8d5] flex items-center gap-1.5">
              <Info size={16} className="text-[#4a7c5a]" />
              Resumo do Local
            </h3>

            <div className="space-y-3">
              <div>
                <span className="font-semibold text-stone-400 block mb-0.5">Tipo</span>
                <span className="text-[#1a3a1f] font-bold text-sm uppercase">{local.tipo || 'Geral'}</span>
              </div>

              {local.sigla && (
                <div>
                  <span className="font-semibold text-stone-400 block mb-0.5">Sigla</span>
                  <span className="text-[#4a7c5a] font-bold text-sm font-mono bg-white px-2 py-0.5 rounded border border-[#dde8d5] inline-block">{local.sigla}</span>
                </div>
              )}

              {(local.latitude !== null && local.longitude !== null) && (
                <div>
                  <span className="font-semibold text-stone-400 block mb-0.5">Coordenadas Geográficas</span>
                  <span className="text-[#4a7c5a] font-medium leading-relaxed font-mono block">
                    Lat: {local.latitude}<br />
                    Long: {local.longitude}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* E. Mapa de espécimes */}
        {(local.latitude !== null && local.longitude !== null && especimes.length > 0) && (
          <section className="mb-12 pt-10 border-t border-[#dde8d5]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1a3a1f] flex items-center gap-2">
                📍 Ocorrências e Espécimes Registrados
              </h2>
              <span className="text-xs font-bold text-[#4a7c5a] bg-[#f0f5ee] rounded-full px-2.5 py-1">
                {especimes.filter(e => e.latitude !== null && e.longitude !== null).length} com coordenadas
              </span>
            </div>

            <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-[#dde8d5] shadow-xs relative z-0">
              <MapContainer
                center={[local.latitude, local.longitude]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {especimes.filter(e => e.latitude !== null && e.longitude !== null).map(ponto => {
                  const especie = especies.find(e => e.id === ponto.especie_id);
                  const famObj = especie ? (Array.isArray(especie.familia) ? especie.familia[0] : especie.familia) : null;
                  const familiaNome = famObj?.familia_nome;

                  return (
                    <Marker
                      key={ponto.id}
                      position={[ponto.latitude!, ponto.longitude!]}
                    >
                      <Popup>
                        <div style={{ minWidth: 180 }} className="text-left font-sans">
                          {especie ? (
                            <>
                              <strong className="italic text-[#1a3a1f]">
                                {especie.nome_cientifico}
                              </strong>
                              {especie.nome_popular && (
                                <div className="text-[#4a7c5a] text-xs font-semibold mt-0.5">
                                  {especie.nome_popular}
                                </div>
                              )}
                              {familiaNome && (
                                <div className="text-stone-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">
                                  {familiaNome}
                                </div>
                              )}
                            </>
                          ) : (
                            <strong className="text-[#1a3a1f]">Espécime</strong>
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
                          {ponto.coletor && (
                            <div className="text-stone-400 text-[10px] mt-1">
                              <strong>Coletor:</strong> {ponto.coletor}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
                <MapBoundsUpdater pontos={especimes.filter(e => e.latitude !== null && e.longitude !== null) as Array<{ latitude: number; longitude: number }>} />
              </MapContainer>
            </div>
          </section>
        )}

        {/* F. Espécies catalogadas */}
        <section className="mb-12 pt-10 border-t border-[#dde8d5]">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="text-xl font-bold text-[#1a3a1f] flex items-center gap-2 flex-shrink-0">
              🌿 Espécies Ocorrentes neste Local
            </h2>
            <input
              type="text"
              value={searchEspecie}
              onChange={e => setSearchEspecie(e.target.value)}
              placeholder="Filtrar espécies..."
              className="text-sm border border-[#dde8d5] rounded-lg px-3 py-2 w-48 bg-white text-[#1a3a1f] placeholder-[#b0c8b0] focus:outline-none focus:border-[#5fcf6e]"
            />
          </div>

          {especiesFiltradas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#dde8d5] shadow-xs">
              <Leaf size={40} className="mx-auto text-stone-300 mb-2 animate-pulse" />
              <p className="text-sm text-stone-500 italic">
                Nenhuma espécie encontrada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
              {especiesFiltradas.map((especie) => {
                const imgUrl = imagemDaEspecie[especie.id];
                const listaEspecimes = especimesPorEspecie[especie.id] ?? [];

                return (
                  <div
                    key={especie.id}
                    onClick={() => {
                      if (listaEspecimes.length === 1) {
                        navigate(`/locais-publico/${local.id}/especime/${listaEspecimes[0].id}`);
                      } else if (listaEspecimes.length > 1) {
                        setModalEspecimes(listaEspecimes);
                        setModalEspecieNome(especie.nome_cientifico);
                        setModalAberto(true);
                      }
                    }}
                    className="group flex flex-col bg-white rounded-2xl border border-[#dde8d5] shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-300 overflow-hidden h-full text-left cursor-pointer"
                  >
                    {/* Imagem/Fallback */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f0f5ee]">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={especie.nome_cientifico}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#4a7c5a] bg-[#2d5a3d]/10">
                          <span className="text-3xl">🌿</span>
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="p-5 flex flex-col flex-grow justify-between">
                      <div>
                        <h3 className="text-base font-bold italic text-[#1a3a1f] group-hover:text-[#4eb85c] transition-colors leading-snug">
                          {especie.nome_cientifico}
                        </h3>
                        {especie.nome_popular && (
                          <p className="text-xs text-[#7a9a7a] mt-2 leading-relaxed font-semibold capitalize">
                            {especie.nome_popular}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-[#dde8d5] flex items-center justify-between text-[#5fcf6e] group-hover:text-[#4eb85c] font-semibold text-xs">
                        <span>
                          {listaEspecimes.length > 1
                            ? `${listaEspecimes.length} espécimes`
                            : 'Ver espécime'}
                        </span>
                        <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* G. Galeria de imagens */}
        <section className="pt-10 border-t border-[#dde8d5]">
          {galeria.length > 0 ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#1a3a1f]">
                  Galeria de Imagens do Local
                </h2>
                <span className="inline-flex px-2.5 py-1 bg-[#f0f5ee] border border-[#dde8d5] text-[#4a7c5a] text-xs font-bold rounded-lg">
                  {galeria.length} {galeria.length === 1 ? 'imagem' : 'imagens'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {galeria.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-[#dde8d5] bg-stone-50 hover:brightness-90 transition duration-300"
                    onClick={() => setGalleryLightboxIndex(idx)}
                  >
                    <img
                      src={img.url_thumbnail || img.url_imagem || undefined}
                      alt="Imagem do espécime no local"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#dde8d5] shadow-xs flex flex-col items-center justify-center">
              <Leaf size={40} className="text-stone-300 mb-2 animate-pulse" />
              <p className="text-sm text-stone-500 italic">
                Nenhuma imagem cadastrada para este local.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Lightbox da Galeria (createPortal z-[100]) */}
      {galleryLightboxIndex !== null && (
        galleryLightboxIndex >= 0 && galleryLightboxIndex < galeria.length
      ) && createPortal(
        <div
          className="fixed inset-0 bg-black/92 flex items-center justify-center z-[100]"
          onClick={() => setGalleryLightboxIndex(null)}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-stone-300 transition-colors p-2 cursor-pointer bg-black/40 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setGalleryLightboxIndex(null);
            }}
            aria-label="Fechar galeria"
          >
            <X size={28} />
          </button>

          {galeria.length > 1 && (
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
              src={galeria[galleryLightboxIndex].url_imagem || undefined}
              alt="Imagem do local ampliada"
              className="max-h-[80vh] max-w-[85vw] object-contain rounded-lg select-none"
            />
            {galeria[galleryLightboxIndex]?.creditos && (
              <div className="w-full mt-3 pt-3 border-t border-white/20 text-center">
                <span className="text-xs text-white/70">
                  {galeria[galleryLightboxIndex].creditos}
                </span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Modal de seleção de espécimes (createPortal z-[100]) */}
      {modalAberto && createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] px-4"
          onClick={() => setModalAberto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div className="flex items-start justify-between mb-5">
              <div className="text-left">
                <p className="text-xs uppercase tracking-widest text-[#4a7c5a] mb-1 font-bold">
                  Espécimes registrados
                </p>
                <h3 className="text-lg font-bold italic text-[#1a3a1f]">
                  {modalEspecieNome}
                </h3>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="text-[#7a9a7a] hover:text-[#1a3a1f] transition-colors cursor-pointer p-1 bg-transparent border-none outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {/* Lista de espécimes */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {modalEspecimes.map(esp => {
                const img = imagemPorEspecime[esp.id];
                return (
                  <button
                    key={esp.id}
                    onClick={() => {
                      setModalAberto(false);
                      navigate(`/locais-publico/${id}/especime/${esp.id}`);
                    }}
                    className="w-full flex items-center gap-4 p-3 rounded-xl border border-[#dde8d5] hover:border-[#5fcf6e] hover:bg-[#f0f5ee] transition-all cursor-pointer text-left bg-white"
                  >
                    {/* Miniatura */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#2d5a3d]/10 flex items-center justify-center text-[#4a7c5a]">
                      {img ? (
                        <img
                          src={img}
                          alt={esp.tombo_codigo || `Espécime ${esp.id}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">🌿</span>
                      )}
                    </div>

                    {/* Dados */}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-bold text-sm text-[#1a3a1f]">
                        {esp.tombo_codigo || `#${esp.id}`}
                      </p>
                      {esp.descricao_ocorrencia && (
                        <p className="text-xs text-[#7a9a7a] truncate mt-0.5 font-normal">
                          {esp.descricao_ocorrencia}
                        </p>
                      )}
                      {esp.detalhes_localizacao && (
                        <p className="text-xs text-[#4a7c5a] truncate font-normal">
                          📍 {esp.detalhes_localizacao}
                        </p>
                      )}
                    </div>

                    <span className="text-[#5fcf6e] text-sm font-semibold flex-shrink-0">→</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
