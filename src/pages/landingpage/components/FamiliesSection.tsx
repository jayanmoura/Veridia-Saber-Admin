import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import { supabase } from '../../../lib/supabase';
import { SpecimenPopupCard } from './SpecimenPopupCard';
import { createDotIcon, createClusterIcon } from './mapMarkerIcons';



// ─── Interfaces ──────────────────────────────────────────────────────────────

interface SpecimenPin {
  id: string;
  latitude: number;
  longitude: number;
  tombo_codigo: string | null;
  tombo_num: string | null;
  nome_cientifico: string;
  nome_popular: string;
  especie_id: string;
  familia_nome: string;
  familia_id: string;
  imagem_url: string | null;
  local_nome: string | null;
}

interface LocalPin {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  cidade: string;
  estado: string;
}

// ─── Supabase row types (planas, sem joins) ───────────────────────────────────

interface FamiliaRow {
  id: string;
  familia_nome: string;
  descricao_familia: string | null;
  imagem_micro: string | null;
  imagem_thumbnail: string | null;
}

interface EspecieRow {
  id: string;
  nome_cientifico: string;
  nome_popular: string | null;
  familia_id: string | null;
}

interface ImagemRow {
  especie_id: string | null;
  url_micro: string | null;
  url_thumbnail: string | null;
}

interface ImagemEspecimeRow {
  especime_id: string | null;
  url_micro: string | null;
  url_thumbnail: string | null;
}

interface EspecieLocalRow {
  id: string;
  latitude: number | null;
  longitude: number | null;
  tombo_codigo: string | null;
  tombo_num: string | null;
  especie_id: string | null;
  local_id: string | null;
}

interface LocalRow {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  latitude: number | null;
  longitude: number | null;
}

// ─── MapController ────────────────────────────────────────────────────────────

interface MapControllerProps {
  activeTab: 'familias' | 'especies' | 'projetos';
  specimensPins: SpecimenPin[];
  projetosPins: LocalPin[];
  mapRef: React.MutableRefObject<L.Map | null>;
}

function MapController({ activeTab, specimensPins, projetosPins, mapRef }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    map.invalidateSize();

    const activePins = activeTab === 'projetos' ? projetosPins : specimensPins;

    if (activePins.length > 0) {
      const bounds = L.latLngBounds(activePins.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
    } else {
      map.setView([-22.74, -43.70], 12);
    }
  }, [activeTab, specimensPins, projetosPins, map, mapRef]);

  return null;
}

// ─── FamiliesSection ──────────────────────────────────────────────────────────

export function FamiliesSection() {
  const [activeTab, setActiveTab] = useState<'familias' | 'especies' | 'projetos'>('familias');
  const [specimensPins, setSpecimensPins] = useState<SpecimenPin[]>([]);
  const [projetosPins, setProjetosPins] = useState<LocalPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [chipSelecionado, setChipSelecionado] = useState<string | null>(null);

  // Resetar filtro ao trocar de aba
  useEffect(() => {
    setChipSelecionado(null);
  }, [activeTab]);

  const mapRef = useRef<L.Map | null>(null);

  // Garantir que Leaflet só renderiza no client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // ── 1. Buscar locais / projetos (query plana) ──────────────────────
        const { data: locData, error: locError } = await supabase
          .from('locais')
          .select('id, nome, cidade, estado, latitude, longitude')
          .order('nome');

        if (locError) throw locError;

        const locRows = (locData as LocalRow[]) || [];
        const localNomeMap = new Map<string, string>(locRows.map(l => [l.id, l.nome]));

        const projPins: LocalPin[] = locRows
          .filter(l => l.latitude !== null && l.longitude !== null)
          .map(l => ({
            id: l.id,
            nome: l.nome,
            latitude: Number(l.latitude),
            longitude: Number(l.longitude),
            cidade: l.cidade || '',
            estado: l.estado || ''
          }));
        setProjetosPins(projPins);

        // ── 4. Buscar espécimes georreferenciados (query plana — padrão admin) ──
        const { data: elData, error: elError } = await supabase
          .from('especie_local')
          .select('id, latitude, longitude, tombo_codigo, tombo_num, especie_id, local_id')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(500);

        if (elError) throw elError;

        const elRows = (elData as EspecieLocalRow[]) || [];

        if (elRows.length > 0) {
          // ── 4a. Buscar espécies pelos especie_id retornados ───────────────
          const especieIds = [...new Set(elRows.map(r => r.especie_id).filter(Boolean))] as string[];

          const { data: especieDetalheData, error: especieDetalheError } = await supabase
            .from('especie')
            .select('id, nome_cientifico, nome_popular, familia_id')
            .in('id', especieIds);

          if (especieDetalheError) throw especieDetalheError;

          const especieMap = new Map<string, EspecieRow>();
          ((especieDetalheData as EspecieRow[]) || []).forEach(e => especieMap.set(e.id, e));

          // ── 4b. Buscar famílias pelos familia_id retornados ───────────────
          const familiaIds = [...new Set(
            Array.from(especieMap.values()).map(e => e.familia_id).filter(Boolean)
          )] as string[];

          const familiaMap = new Map<string, string>(); // id -> familia_nome

          if (familiaIds.length > 0) {
            const { data: familiaDetalheData, error: familiaDetalheError } = await supabase
              .from('familia')
              .select('id, familia_nome')
              .in('id', familiaIds);

            if (familiaDetalheError) throw familiaDetalheError;

            ((familiaDetalheData as FamiliaRow[]) || []).forEach(f => familiaMap.set(f.id, f.familia_nome));
          }

          // ── 4b2. Buscar imagem do espécime específico (prioridade) e da espécie (reserva) ──
          const especimeIds = elRows.map(r => r.id);

          const imagemPorEspecieId = new Map<string, string | null>();
          const imagemPorEspecimeId = new Map<string, string | null>();

          const [
            { data: imagensEspecieData, error: imagensEspecieError },
            { data: imagensEspecimeData, error: imagensEspecimeError }
          ] = await Promise.all([
            supabase
              .from('imagens')
              .select('especie_id, url_micro, url_thumbnail')
              .in('especie_id', especieIds),
            supabase
              .from('imagens')
              .select('especime_id, url_micro, url_thumbnail')
              .in('especime_id', especimeIds)
          ]);

          if (imagensEspecieError) throw imagensEspecieError;
          if (imagensEspecimeError) throw imagensEspecimeError;

          ((imagensEspecieData as ImagemRow[]) || []).forEach(img => {
            if (!img.especie_id || imagemPorEspecieId.has(img.especie_id)) return;
            imagemPorEspecieId.set(img.especie_id, img.url_micro || img.url_thumbnail || null);
          });

          ((imagensEspecimeData as ImagemEspecimeRow[]) || []).forEach(img => {
            if (!img.especime_id || imagemPorEspecimeId.has(img.especime_id)) return;
            imagemPorEspecimeId.set(img.especime_id, img.url_micro || img.url_thumbnail || null);
          });

          // ── 4c. Montar os pins ─────────────────────────────────────────────
          const pins: SpecimenPin[] = elRows
            .filter(r => r.especie_id !== null)
            .map(r => {
              const esp = especieMap.get(r.especie_id as string);
              const familiaId = esp?.familia_id || '';
              const familiaNome = familiaId ? (familiaMap.get(familiaId) || 'Desconhecida') : 'Desconhecida';
              return {
                id: r.id,
                latitude: Number(r.latitude),
                longitude: Number(r.longitude),
                tombo_codigo: r.tombo_codigo,
                tombo_num: r.tombo_num,
                nome_cientifico: esp?.nome_cientifico || 'Desconhecida',
                nome_popular: esp?.nome_popular || '',
                especie_id: r.especie_id as string,
                familia_nome: familiaNome,
                familia_id: familiaId,
                imagem_url: imagemPorEspecimeId.get(r.id) || imagemPorEspecieId.get(r.especie_id as string) || null,
                local_nome: r.local_id ? (localNomeMap.get(r.local_id) || null) : null
              };
            });

          setSpecimensPins(pins);
        } else {
          setSpecimensPins([]);
        }

      } catch (err) {
        console.error('Erro ao carregar dados do painel botânico:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ─── Derivadas ────────────────────────────────────────────────────────────

  // Obter chips da aba ativa baseados nos pins georreferenciados no mapa
  const getChips = () => {
    if (activeTab === 'familias') {
      const visto = new Set<string>();
      const resultado: Array<{ id: string; label: string }> = [];
      for (const pin of specimensPins) {
        if (pin.familia_id && !visto.has(pin.familia_id)) {
          visto.add(pin.familia_id);
          resultado.push({ id: pin.familia_id, label: pin.familia_nome });
        }
      }
      return resultado.sort((a, b) => a.label.localeCompare(b.label));
    }
    if (activeTab === 'especies') {
      const visto = new Set<string>();
      const resultado: Array<{ id: string; label: string }> = [];
      for (const pin of specimensPins) {
        if (pin.especie_id && !visto.has(pin.especie_id)) {
          visto.add(pin.especie_id);
          resultado.push({ id: pin.especie_id, label: pin.nome_cientifico });
        }
      }
      return resultado.sort((a, b) => a.label.localeCompare(b.label));
    }
    if (activeTab === 'projetos') {
      return projetosPins
        .map(p => ({ id: p.id, label: p.nome }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    return [];
  };

  const chips = getChips();

  const specimensPinsFiltrados = specimensPins.filter(pin => {
    if (!chipSelecionado) return true;
    if (activeTab === 'familias') return pin.familia_id === chipSelecionado;
    if (activeTab === 'especies') return pin.especie_id === chipSelecionado;
    return true;
  });

  const projetosPinsFiltrados = projetosPins.filter(pin => {
    if (!chipSelecionado) return true;
    if (activeTab === 'projetos') return String(pin.id) === chipSelecionado;
    return true;
  });

  const activePins = activeTab === 'projetos' ? projetosPinsFiltrados : specimensPinsFiltrados;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="py-10 px-6 bg-transparent">
      <div className="container mx-auto max-w-6xl space-y-6">

        {/* Título e Dropdowns Alinhados */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-forest-200 mb-6">
          {/* Esquerda: tag + título */}
          <div className="text-left">
            <p className="text-xs uppercase tracking-widest text-forest-600 mb-1 font-bold">
              FILOGENIA E DISTRIBUIÇÃO
            </p>
            <h2 className="text-2xl font-bold text-forest-900">Explore o Acervo</h2>
          </div>

          {/* Direita: dropdowns */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Dropdown 1: Tipo de visualização */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-forest-600">Explorar:</label>
              <select
                value={activeTab}
                onChange={e => {
                  setActiveTab(e.target.value as 'familias' | 'especies' | 'projetos');
                  setChipSelecionado(null);
                }}
                className="text-sm border border-forest-200 rounded-lg px-3 py-2 bg-white text-forest-900 focus:outline-none focus:border-forest-400 cursor-pointer font-medium"
              >
                <option value="familias">Famílias</option>
                <option value="especies">Espécies</option>
                <option value="projetos">Projetos</option>
              </select>
            </div>

            {/* Dropdown 2: filtro por item específico */}
            {!loading && chips.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-forest-600">Filtrar:</label>
                <select
                  value={chipSelecionado ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    setChipSelecionado(val || null);
                    // Ao selecionar, fazer flyTo no mapa para o item correspondente
                    if (val && mapRef.current) {
                      const ponto = activeTab === 'projetos'
                        ? projetosPins.find(p => String(p.id) === val)
                        : specimensPins.find(p => {
                            if (activeTab === 'familias') return p.familia_id === val;
                            if (activeTab === 'especies') return p.especie_id === val;
                            return false;
                          });
                      if (ponto) {
                        mapRef.current.flyTo([ponto.latitude, ponto.longitude], 16);
                      }
                    }
                  }}
                  className="text-sm border border-forest-200 rounded-lg px-3 py-2 bg-white text-forest-900 focus:outline-none focus:border-forest-400 cursor-pointer font-medium max-w-[200px]"
                >
                  <option value="">Todos</option>
                  {chips.map(chip => (
                    <option key={chip.id} value={chip.id}>
                      {chip.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Mapa Leaflet */}
        <div className="w-full h-[480px] rounded-2xl overflow-hidden border border-forest-200 relative z-0">
          {loading && (
            <div className="absolute inset-0 z-50 bg-forest-200 animate-pulse rounded-2xl flex items-center justify-center">
              <span className="text-xs font-semibold text-forest-600">Carregando mapa interativo...</span>
            </div>
          )}

          {!loading && activePins.length === 0 && (
            <div className="absolute inset-0 z-[1000] bg-forest-900/5 backdrop-blur-xs flex items-center justify-center pointer-events-none">
              <div className="bg-white border border-forest-200 rounded-xl px-5 py-3 shadow-md text-xs sm:text-sm font-semibold text-forest-900">
                Nenhum espécime georreferenciado ainda
              </div>
            </div>
          )}

          {isMounted && (
            <MapContainer
              center={[-22.74, -43.70]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <MapController
                activeTab={activeTab}
                specimensPins={specimensPinsFiltrados}
                projetosPins={projetosPinsFiltrados}
                mapRef={mapRef}
              />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Marcadores de Espécimes (abas Famílias e Espécies) */}
              {activeTab !== 'projetos' && (
                <MarkerClusterGroup iconCreateFunction={createClusterIcon} maxClusterRadius={50} spiderfyOnMaxZoom>
                  {specimensPinsFiltrados.map((pin) => (
                    <Marker
                      key={`specimen-${pin.id}`}
                      position={[pin.latitude, pin.longitude]}
                      icon={createDotIcon(activeTab === 'familias' ? '#5fcf6e' : '#4a7c5a')}
                    >
                      <Popup maxWidth={260} autoPan={false}>
                        <SpecimenPopupCard
                          imagemUrl={pin.imagem_url}
                          nomeCientifico={pin.nome_cientifico}
                          nomePopular={pin.nome_popular}
                          familiaNome={pin.familia_nome}
                          tombo={pin.tombo_codigo ?? pin.tombo_num}
                          localNome={pin.local_nome}
                        />
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              )}

              {/* Marcadores de Projetos */}
              {activeTab === 'projetos' && (
                <MarkerClusterGroup iconCreateFunction={createClusterIcon} maxClusterRadius={50} spiderfyOnMaxZoom>
                  {projetosPinsFiltrados.map((pin) => (
                    <Marker
                      key={`projeto-${pin.id}`}
                      position={[pin.latitude, pin.longitude]}
                      icon={createDotIcon('#1a3a1f')}
                    >
                      <Popup autoPan={false}>
                        <div>
                          <strong>{pin.nome}</strong>
                          <br />
                          <span style={{ fontSize: '12px', color: '#555' }}>
                            {pin.cidade && pin.estado
                              ? `${pin.cidade}, ${pin.estado}`
                              : pin.cidade || pin.estado || ''}
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              )}
            </MapContainer>
          )}
        </div>

      </div>
    </section>
  );
}
