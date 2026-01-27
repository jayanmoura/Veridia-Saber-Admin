import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabase';
import { Loader2, Layers, Map as MapIcon, RotateCcw } from 'lucide-react';
import L from 'leaflet';
import { specimenRepo } from '../../services/specimenRepo';

// Utility to create custom div icons for Project Balloons
const createProjectIcon = (name: string, count: number) => {
    return L.divIcon({
        className: 'bg-transparent border-0',
        html: `
            <div class="relative transform -translate-x-1/2 -translate-y-full -mt-3 group cursor-pointer" style="width: max-content;">
                <div class="bg-white px-3 py-2 rounded-lg shadow-lg border border-emerald-100 flex items-center gap-2 transition-transform transform hover:scale-105 group-hover:border-emerald-500 max-w-[200px]">
                    <div class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                    <span class="font-bold text-gray-800 text-sm truncate block">${name}</span>
                    <span class="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0">${count}</span>
                </div>
                <!-- Tip -->
                <div class="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1 w-3 h-3 bg-white rotate-45 border-r border-b border-emerald-100 group-hover:border-emerald-500 z-10"></div>
            </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
    });
};

interface PlantLocation {
    id: string;
    latitude: number;
    longitude: number;
    species_name: string;
    family_name: string;
    project_id: number;
    project_name: string;
    image?: string;
    project_lat?: number;
    project_lng?: number;
}

interface ProjectCluster {
    id: number;
    name: string;
    lat: number;
    lng: number;
    count: number;
}

const MapController = () => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
    }, [map]);
    return null;
};

// Component to handle zoom to project
const ZoomHandler = ({ target }: { target: { lat: number, lng: number, zoom: number } | null }) => {
    const map = useMap();
    useEffect(() => {
        if (target) {
            map.flyTo([target.lat, target.lng], target.zoom, { duration: 1.5 });
        }
    }, [target, map]);
    return null;
};

export function ProjectMapViz() {
    const [projects, setProjects] = useState<any[]>([]);
    const [plants, setPlants] = useState<PlantLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'projects' | 'plants'>('projects');
    const [mapStyle, setMapStyle] = useState<'light' | 'dark' | 'satellite'>('light');
    const [focussedProject, setFocussedProject] = useState<number | null>(null);
    const [mapTarget, setMapTarget] = useState<{ lat: number, lng: number, zoom: number } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Projects (Locais) to serve as primary clusters headers
            const { data: projectsData, error: projectsError } = await supabase
                .from('locais')
                .select('id, nome, latitude, longitude');

            if (projectsError) throw projectsError;

            // 2. Fetch plants linked to projects using Repo
            // We want ALL plants with coordinates
            const plantsData = await specimenRepo.listSpecimens({
                withCoordinates: true
            });

            const mappedPlants: PlantLocation[] = (plantsData || []).map((item: any) => ({
                id: item.id,
                latitude: Number(item.latitude),
                longitude: Number(item.longitude),
                species_name: item.especie?.nome_cientifico || 'Espécie Desconhecida',
                family_name: item.especie?.familia?.familia_nome || 'Sem Família',
                project_id: item.local_id,
                project_name: item.locais?.nome || 'Projeto Desconhecido',
                project_lat: item.locais?.latitude ? Number(item.locais.latitude) : undefined,
                project_lng: item.locais?.longitude ? Number(item.locais.longitude) : undefined,
                image: item.especie?.imagens?.[0]?.url_imagem
            }));

            setProjects(projectsData || []);
            setPlants(mappedPlants);
        } catch (error) {
            console.error('Error fetching project map data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate project clusters
    const projectClusters = useMemo(() => {
        const clusters: Record<number, { latSum: number, lngSum: number, count: number, name: string, fixedLat?: number, fixedLng?: number }> = {};

        // 1. Initialize clusters with ALL projects that have coordinates
        projects.forEach(proj => {
            if (proj.latitude && proj.longitude) {
                clusters[proj.id] = {
                    latSum: 0,
                    lngSum: 0,
                    count: 0,
                    name: proj.nome,
                    fixedLat: Number(proj.latitude),
                    fixedLng: Number(proj.longitude)
                };
            }
        });

        // 2. Add plants to clusters (creating new ones if project didn't have coords but has plants)
        plants.forEach(p => {
            if (!clusters[p.project_id]) {
                // Determine if we have fixed coords from the plant relations
                clusters[p.project_id] = {
                    latSum: 0,
                    lngSum: 0,
                    count: 0,
                    name: p.project_name,
                    fixedLat: p.project_lat,
                    fixedLng: p.project_lng
                };
            }

            clusters[p.project_id].latSum += p.latitude;
            clusters[p.project_id].lngSum += p.longitude;
            clusters[p.project_id].count++;
        });

        // 3. Convert to array and determine final position
        return Object.entries(clusters)
            .map(([id, data]) => {
                const hasFixed = data.fixedLat !== undefined && data.fixedLng !== undefined;

                // If no fixed coords and no count (shouldn't happen due to logic above, but safety check)
                if (!hasFixed && data.count === 0) return null;

                const finalLat = hasFixed ? data.fixedLat! : (data.latSum / data.count);
                const finalLng = hasFixed ? data.fixedLng! : (data.lngSum / data.count);

                return {
                    id: Number(id),
                    name: data.name,
                    lat: finalLat,
                    lng: finalLng,
                    count: data.count
                };
            })
            .filter((c): c is ProjectCluster => c !== null); // Remove nulls

    }, [plants, projects]);

    const handleProjectClick = (cluster: ProjectCluster) => {
        setFocussedProject(cluster.id);
        setViewMode('plants');
        setMapTarget({ lat: cluster.lat, lng: cluster.lng, zoom: 16 });
    };

    const handleResetView = () => {
        setFocussedProject(null);
        setViewMode('projects');
        setMapTarget({ lat: -14.2350, lng: -51.9253, zoom: 4 }); // Brazil View
    };

    // Filter plants based on view mode
    const visiblePlants = useMemo(() => {
        if (viewMode === 'projects') return []; // Show no plants, only project markers
        if (focussedProject) return plants.filter(p => p.project_id === focussedProject);
        return plants; // Show all if mode is 'plants' but no specific project focussed (Raw View)
    }, [viewMode, focussedProject, plants]);

    const getTileUrl = () => {
        switch (mapStyle) {
            case 'dark': return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            case 'satellite': return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            default: return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Controls */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <MapIcon size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Mapa dos Projetos</h3>
                        <p className="text-xs text-gray-500">Visualização agrupada por locais oficiais</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => { setViewMode('projects'); setFocussedProject(null); setMapTarget({ lat: -14.2350, lng: -51.9253, zoom: 4 }); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'projects' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Projetos
                        </button>
                        <button
                            onClick={() => { setViewMode('plants'); setFocussedProject(null); }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'plants' && !focussedProject ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Todos os Espécimes
                        </button>
                    </div>

                    {/* Reset Button (Visible if drilled down) */}
                    {focussedProject && (
                        <button
                            onClick={handleResetView}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                            <RotateCcw size={12} />
                            Voltar
                        </button>
                    )}

                    {/* Style Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setMapStyle('light')} className={`p-1.5 rounded-md ${mapStyle === 'light' ? 'bg-white shadow' : ''}`} title="Claro"><Layers size={14} /></button>
                        <button onClick={() => setMapStyle('satellite')} className={`p-1.5 rounded-md ${mapStyle === 'satellite' ? 'bg-green-700 text-white shadow' : ''}`} title="Satélite"><Layers size={14} /></button>
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

                <MapContainer center={[-14.2350, -51.9253]} zoom={4} maxZoom={22} style={{ height: '100%', width: '100%' }}>
                    <MapController />
                    <ZoomHandler target={mapTarget} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url={getTileUrl()}
                        maxNativeZoom={19}
                        maxZoom={22}
                    />

                    {/* Render Project Markers (Balloons) */}
                    {viewMode === 'projects' && projectClusters.map(cluster => (
                        <Marker
                            key={cluster.id}
                            position={[cluster.lat, cluster.lng]}
                            icon={createProjectIcon(cluster.name, cluster.count)}
                            eventHandlers={{
                                click: () => handleProjectClick(cluster)
                            }}
                        />
                    ))}

                    {/* Render Individual Plants */}
                    {viewMode === 'plants' && visiblePlants.map(plant => (
                        <CircleMarker
                            key={plant.id}
                            center={[plant.latitude, plant.longitude]}
                            radius={6}
                            fillColor="#4F46E5" // Indigo
                            color="#fff"
                            weight={1}
                            opacity={0.8}
                            fillOpacity={0.7}
                        >
                            <Popup>
                                <div className="p-1">
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                                        {plant.family_name}
                                    </span>
                                    <h3 className="font-bold text-gray-900 mb-1">{plant.species_name}</h3>
                                    <p className="text-xs text-gray-500 mb-2">{plant.project_name}</p>
                                    {plant.image && (
                                        <div className="w-full h-24 rounded overflow-hidden">
                                            <img src={plant.image} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
