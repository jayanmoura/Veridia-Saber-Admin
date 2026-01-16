import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabase';
import { Loader2, Filter, X, Map as MapIcon, Layers } from 'lucide-react';

interface LocationData {
    id: string;
    latitude: number;
    longitude: number;
    species_name: string;
    family_name: string;
    collector: string;
    date: string;
    image?: string;
}

// Fix Leaflet clean up issues
const MapController = () => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
    }, [map]);
    return null;
};

export function GlobalHeatmap() {
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterFamily, setFilterFamily] = useState('');
    const [uniqueFamilies, setUniqueFamilies] = useState<string[]>([]);
    const [mapStyle, setMapStyle] = useState<'light' | 'dark' | 'satellite'>('light');

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            // Fetch field collections with coordinates
            const { data, error } = await supabase
                .from('plantas_da_colecao')
                .select(`
                    id, 
                    latitude, 
                    longitude, 
                    especie, 
                    familia_custom,
                    familia_id,
                    data_registro, 
                    fotos
                `)
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)
                .limit(2000); // Safety limit

            if (error) throw error;

            const mapped: LocationData[] = (data || []).map((item: any) => ({
                id: item.id,
                latitude: Number(item.latitude),
                longitude: Number(item.longitude),
                species_name: item.especie || 'Não Identificada',
                family_name: item.familia?.familia_nome || item.familia_custom || 'Sem Família',
                collector: item.profiles?.full_name || 'Usuário do App',
                date: item.data_registro,
                image: item.fotos && item.fotos.length > 0 ? item.fotos[0] : undefined
            }));

            setLocations(mapped);

            // Extract unique families for filter
            const families = Array.from(new Set(mapped.map(l => l.family_name))).sort();
            setUniqueFamilies(families);

        } catch (error: any) {
            console.error('Error fetching map data:', error);
            // Mostrar erro visualmente para debug
            alert(`Erro ao carregar mapa: ${error.message || 'Erro desconhecido'}.`);
        } finally {
            setLoading(false);
        }
    };

    const filteredLocations = filterFamily
        ? locations.filter(l => l.family_name === filterFamily)
        : locations;

    // Center map calculation
    const center: [number, number] = filteredLocations.length > 0
        ? [filteredLocations[0].latitude, filteredLocations[0].longitude]
        : [-14.2350, -51.9253]; // Brazil Center

    const getTileUrl = () => {
        switch (mapStyle) {
            case 'dark': return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            case 'satellite': return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            default: return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        }
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center animate-fade-in-up">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <MapIcon size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Mapa de Distribuição Global</h3>
                        <p className="text-xs text-gray-500">{filteredLocations.length} coletas mapeadas</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Style Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setMapStyle('light')}
                            className={`p-1.5 rounded-md text-xs font-medium transition-all ${mapStyle === 'light' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Mapa Claro"
                        >
                            <Layers size={14} />
                        </button>
                        <button
                            onClick={() => setMapStyle('dark')}
                            className={`p-1.5 rounded-md text-xs font-medium transition-all ${mapStyle === 'dark' ? 'bg-gray-800 shadow text-white' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Mapa Escuro"
                        >
                            <Layers size={14} className="fill-current" />
                        </button>
                        <button
                            onClick={() => setMapStyle('satellite')}
                            className={`p-1.5 rounded-md text-xs font-medium transition-all ${mapStyle === 'satellite' ? 'bg-green-700 shadow text-white' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Satélite"
                        >
                            <Layers size={14} />
                        </button>
                    </div>

                    {/* Filter */}
                    <div className="relative w-full md:w-64">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
                            value={filterFamily}
                            onChange={(e) => setFilterFamily(e.target.value)}
                        >
                            <option value="">Todas as Famílias</option>
                            {uniqueFamilies.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                        {filterFamily && (
                            <button
                                onClick={() => setFilterFamily('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0 animate-fade-in-up delay-75">
                {loading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
                        <Loader2 className="animate-spin text-emerald-600" size={40} />
                    </div>
                )}

                <MapContainer
                    center={center}
                    zoom={4}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <MapController />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url={getTileUrl()}
                    />

                    {filteredLocations.map((loc) => (
                        <CircleMarker
                            key={loc.id}
                            center={[loc.latitude, loc.longitude]}
                            radius={6}
                            fillColor={filterFamily ? "#10B981" : "#059669"} // Emerald-500 vs 600
                            color="#ffffff"
                            weight={1}
                            opacity={0.8}
                            fillOpacity={0.6}
                        >
                            <Popup>
                                <div className="p-1">
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                                        {loc.family_name}
                                    </span>
                                    <h3 className="font-bold text-gray-900 mb-1">{loc.species_name}</h3>

                                    {loc.image && (
                                        <div className="w-full h-32 mb-2 rounded-lg overflow-hidden bg-gray-100">
                                            <img src={loc.image} alt={loc.species_name} className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-500 space-y-1">
                                        <p><strong>Coletor:</strong> {loc.collector}</p>
                                        <p><strong>Data:</strong> {new Date(loc.date).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
