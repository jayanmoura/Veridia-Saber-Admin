/**
 * ProjectMap - Mapa exclusivo para usuários de nível Local.
 * Mostra apenas espécies do projeto vinculado ao local_id do usuário.
 * Estilo consistente com os outros mapas do sistema (CartoDB + CircleMarkers)
 */
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import { MapPinned, AlertTriangle, Loader2, Leaf, Layers } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Utility to create project center icon
const createProjectCenterIcon = (name: string) => {
    return L.divIcon({
        className: 'bg-transparent border-0',
        html: `
            <div class="relative transform -translate-x-1/2 -translate-y-full -mt-3 group cursor-pointer" style="width: max-content;">
                <div class="bg-emerald-600 px-3 py-2 rounded-lg shadow-lg border border-emerald-700 flex items-center gap-2 max-w-[200px]">
                    <div class="w-2 h-2 rounded-full bg-white flex-shrink-0"></div>
                    <span class="font-bold text-white text-sm truncate block">${name}</span>
                </div>
                <div class="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1 w-3 h-3 bg-emerald-600 rotate-45 border-r border-b border-emerald-700 z-10"></div>
            </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
    });
};

interface ProjectData {
    id: number;
    nome: string;
    latitude: number | null;
    longitude: number | null;
}

interface SpeciesLocation {
    id: string;
    latitude: number | null;
    longitude: number | null;
    descricao_ocorrencia: string | null;
    especie: {
        id: string;
        nome_cientifico: string;
        nome_popular: string | null;
        familia?: { familia_nome: string } | null;
        imagens?: { url_imagem: string }[] | null;
    } | null;
}

const MapController = () => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
    }, [map]);
    return null;
};

// Component to fit map to species bounds
const FitBounds = ({ species, projectCenter }: { species: { latitude: number, longitude: number }[], projectCenter?: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        if (species.length > 0) {
            const bounds = L.latLngBounds(species.map(s => [s.latitude, s.longitude]));
            // Add some padding
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
        } else if (projectCenter) {
            map.setView(projectCenter, 16);
        }
    }, [species, projectCenter, map]);
    return null;
};

export default function ProjectMap() {
    const { profile } = useAuth();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [species, setSpecies] = useState<SpeciesLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mapStyle, setMapStyle] = useState<'light' | 'satellite'>('light');

    // Access check - only users with local_id
    const hasAccess = profile?.local_id != null;

    useEffect(() => {
        if (!profile?.local_id) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch project/location details
                const { data: projectData, error: projectError } = await supabase
                    .from('locais')
                    .select('id, nome, latitude, longitude')
                    .eq('id', profile.local_id)
                    .single();

                if (projectError) throw projectError;
                setProject(projectData);

                // Fetch species ONLY from this project
                const { data: speciesData, error: speciesError } = await supabase
                    .from('especie_local')
                    .select(`
                        id,
                        latitude,
                        longitude,
                        descricao_ocorrencia,
                        especie:especie_id (
                            id,
                            nome_cientifico,
                            nome_popular,
                            familia:familia_id(familia_nome),
                            imagens(url_imagem)
                        )
                    `)
                    .eq('local_id', profile.local_id)
                    .not('latitude', 'is', null)
                    .not('longitude', 'is', null);

                if (speciesError) throw speciesError;

                // Map to correct structure
                const mappedSpecies: SpeciesLocation[] = (speciesData || []).map((sp: any) => ({
                    id: sp.id,
                    latitude: sp.latitude,
                    longitude: sp.longitude,
                    descricao_ocorrencia: sp.descricao_ocorrencia,
                    especie: Array.isArray(sp.especie) ? sp.especie[0] : sp.especie
                }));

                setSpecies(mappedSpecies);
            } catch (err: any) {
                console.error('Error fetching project map data:', err);
                setError(err.message || 'Erro ao carregar dados do mapa.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profile?.local_id]);

    const getTileUrl = () => {
        switch (mapStyle) {
            case 'satellite': return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            default: return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        }
    };

    // Filter species with valid coordinates
    const validSpecies = useMemo(() =>
        species.filter(s => s.latitude && s.longitude),
        [species]);

    // Access denied
    if (!hasAccess) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertTriangle className="text-red-500" size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h1>
                <p className="text-gray-500 max-w-md">
                    Esta página é exclusiva para usuários vinculados a um projeto local.
                </p>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertTriangle className="text-red-500" size={48} />
                </div>
                <h1 className="text-xl font-bold text-gray-800 mb-2">Erro ao carregar</h1>
                <p className="text-gray-500">{error}</p>
            </div>
        );
    }

    // Default center (Brazil) if project has no coordinates
    const center: [number, number] = project?.latitude && project?.longitude
        ? [project.latitude, project.longitude]
        : [-15.7801, -47.9292]; // Brasília

    return (
        <div className="space-y-4 animate-fade-in-up">
            {/* Header Controls */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <MapPinned size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800">Mapa do Projeto</h1>
                        <p className="text-xs text-gray-500">{project?.nome || 'Carregando...'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Species count badge */}
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                        <Leaf size={16} className="text-emerald-600" />
                        <span className="font-medium text-emerald-700">{validSpecies.length}</span>
                        <span className="text-sm text-emerald-600">espécies mapeadas</span>
                    </div>

                    {/* Style Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setMapStyle('light')}
                            className={`p-1.5 rounded-md transition-all ${mapStyle === 'light' ? 'bg-white shadow' : ''}`}
                            title="Claro"
                        >
                            <Layers size={14} />
                        </button>
                        <button
                            onClick={() => setMapStyle('satellite')}
                            className={`p-1.5 rounded-md transition-all ${mapStyle === 'satellite' ? 'bg-emerald-600 text-white shadow' : ''}`}
                            title="Satélite"
                        >
                            <Layers size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
                {loading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
                        <Loader2 className="animate-spin text-emerald-600" size={40} />
                    </div>
                )}

                <MapContainer
                    center={center}
                    zoom={project?.latitude ? 15 : 4}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <MapController />
                    <FitBounds
                        species={validSpecies.filter(s => s.latitude && s.longitude).map(s => ({ latitude: s.latitude!, longitude: s.longitude! }))}
                        projectCenter={project?.latitude && project?.longitude ? [project.latitude, project.longitude] : undefined}
                    />
                    <TileLayer attribution='&copy; CARTO' url={getTileUrl()} />

                    {/* Project center marker */}
                    {project?.latitude && project?.longitude && (
                        <Marker
                            position={[project.latitude, project.longitude]}
                            icon={createProjectCenterIcon(project.nome)}
                        />
                    )}

                    {/* Species markers */}
                    {validSpecies.map((sp) => (
                        <CircleMarker
                            key={sp.id}
                            center={[sp.latitude!, sp.longitude!]}
                            radius={8}
                            fillColor="#10B981"
                            color="#fff"
                            weight={2}
                            opacity={1}
                            fillOpacity={0.8}
                        >
                            <Popup>
                                <div className="w-[180px]">
                                    {/* Image on top */}
                                    {sp.especie?.imagens?.[0]?.url_imagem && (
                                        <div className="w-full aspect-square rounded-t overflow-hidden">
                                            <img
                                                src={sp.especie.imagens[0].url_imagem}
                                                alt={sp.especie.nome_cientifico}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Info section */}
                                    <div className="py-1.5 text-xs">
                                        {/* Família */}
                                        {sp.especie?.familia?.familia_nome && (
                                            <p style={{ margin: 0 }}><span className="text-gray-900 font-bold">Família: </span><span className="text-emerald-600">{sp.especie.familia.familia_nome}</span></p>
                                        )}
                                        {/* Espécie */}
                                        <p style={{ margin: 0 }}><span className="text-gray-900 font-bold">Espécie: </span><span className="text-emerald-600 italic">{sp.especie?.nome_cientifico || 'Desconhecida'}</span></p>
                                        {/* Localização */}
                                        <p style={{ margin: 0 }}><span className="text-gray-900 font-bold">Local: </span><span className="text-emerald-600">{sp.latitude?.toFixed(5)}, {sp.longitude?.toFixed(5)}</span></p>
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>

                {/* Empty state */}
                {!loading && validSpecies.length === 0 && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 pointer-events-none">
                        <Leaf size={48} className="text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">Nenhuma espécie com coordenadas neste projeto.</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Adicione coordenadas GPS ao registrar espécies.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
