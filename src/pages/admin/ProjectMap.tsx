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
import { MapPinned, AlertTriangle, Loader2, Leaf, Layers, User, FileText } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { specimenRepo } from '../../services/specimenRepo'; // Import Repo

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

interface TaxonomistData {
    id: string;
    full_name: string;
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
        created_by?: string | null; // Who created the species
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
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 19 });
        } else if (projectCenter) {
            map.setView(projectCenter, 16);
        }
    }, [species, projectCenter, map]);
    return null;
};

export default function ProjectMap() {
    const { profile, session } = useAuth();
    const currentUserId = session?.user?.id;
    const [project, setProject] = useState<ProjectData | null>(null);
    const [species, setSpecies] = useState<SpeciesLocation[]>([]);
    const [taxonomists, setTaxonomists] = useState<TaxonomistData[]>([]);
    const [selectedTaxonomist, setSelectedTaxonomist] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mapStyle, setMapStyle] = useState<'light' | 'satellite'>('light');

    // Access check - only users with local_id
    const hasAccess = profile?.local_id != null;
    const isGestor = profile?.role === 'Gestor de Acervo';

    // Helper to determine marker color - orange for user's own plants, green for others
    const getMarkerColor = (createdBy: string | null | undefined) => {
        if (currentUserId && createdBy === currentUserId) {
            return '#F97316'; // Orange-500 for user's own plants
        }
        return '#10B981'; // Emerald-500 for other plants
    };

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

                // Fetch specimens (occurrences) from this project using the semantics VIEW via Repo
                const speciesData = await specimenRepo.listSpecimens({
                    localId: Number(profile.local_id),
                    withCoordinates: true
                });

                // Map to correct structure
                const mappedSpecies: SpeciesLocation[] = (speciesData || []).map((sp: any) => ({
                    id: sp.id,
                    latitude: sp.latitude,
                    longitude: sp.longitude,
                    descricao_ocorrencia: sp.descricao_ocorrencia,
                    especie: Array.isArray(sp.especie) ? sp.especie[0] : sp.especie
                }));

                setSpecies(mappedSpecies);

                // Fetch taxonomists from this project (only for Gestor de Acervo)
                if (profile.role === 'Gestor de Acervo') {
                    const { data: taxonomistData } = await supabase
                        .from('profiles')
                        .select('id, full_name')
                        .eq('local_id', profile.local_id)
                        .eq('role', 'Taxonomista de Campo');

                    setTaxonomists(taxonomistData || []);
                }
            } catch (err: any) {
                console.error('Error fetching project map data:', err);
                setError(err.message || 'Erro ao carregar dados do mapa.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profile?.local_id, profile?.role]);

    const getTileUrl = () => {
        switch (mapStyle) {
            case 'satellite': return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            default: return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        }
    };

    // Filter species with valid coordinates and optional taxonomist filter
    const validSpecies = useMemo(() => {
        let filtered = species.filter(s => s.latitude && s.longitude);
        if (selectedTaxonomist) {
            filtered = filtered.filter(s => s.especie?.created_by === selectedTaxonomist);
        }
        return filtered;
    }, [species, selectedTaxonomist]);

    // Generate PDF report for selected taxonomist
    const generateReport = () => {
        if (!selectedTaxonomist || !project) return;

        const taxonomist = taxonomists.find(t => t.id === selectedTaxonomist);
        const taxonomistSpecies = validSpecies;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(16, 185, 129); // Emerald
        doc.text('Relatório de Catalogação', 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(`Projeto: ${project.nome}`, 14, 30);
        doc.text(`Taxonomista: ${taxonomist?.full_name || 'Desconhecido'}`, 14, 37);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 44);
        doc.text(`Total de plantas: ${taxonomistSpecies.length}`, 14, 51);

        // Table
        const tableData = taxonomistSpecies.map((sp, index) => [
            index + 1,
            sp.especie?.nome_cientifico || 'N/I',
            sp.especie?.familia?.familia_nome || 'N/I',
            `${sp.latitude?.toFixed(5)}, ${sp.longitude?.toFixed(5)}`,
        ]);

        autoTable(doc, {
            startY: 58,
            head: [['#', 'Espécie', 'Família', 'Coordenadas']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] },
            styles: { fontSize: 9 },
        });

        // Save
        doc.save(`relatorio_${taxonomist?.full_name?.replace(/\s+/g, '_') || 'taxonomista'}.pdf`);
    };

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
                        <span className="text-sm text-emerald-600">espécimes mapeados</span>
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

                    {/* Taxonomist Filter - Only for Gestor de Acervo */}
                    {isGestor && (
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <select
                                    value={selectedTaxonomist}
                                    onChange={(e) => setSelectedTaxonomist(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white min-w-[180px]"
                                    disabled={taxonomists.length === 0}
                                >
                                    {taxonomists.length === 0 ? (
                                        <option value="">Nenhum taxonomista</option>
                                    ) : (
                                        <>
                                            <option value="">Todos os Taxonomistas</option>
                                            {taxonomists.map(t => (
                                                <option key={t.id} value={t.id}>{t.full_name}</option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                            {selectedTaxonomist && (
                                <button
                                    onClick={generateReport}
                                    className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                    title="Gerar relatório PDF"
                                >
                                    <FileText size={16} />
                                    <span className="hidden sm:inline">Relatório</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Map */}
            <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
                {loading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
                        <Loader2 className="animate-spin text-emerald-600" size={40} />
                    </div>
                )}

                {/* Legend - Only show if user is logged in */}
                {currentUserId && (
                    <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1.5">Legenda</p>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-sm"></div>
                                <span className="text-xs text-gray-600">Cadastro por Mim</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm"></div>
                                <span className="text-xs text-gray-600">Cadastros da Instituição</span>
                            </div>
                        </div>
                    </div>
                )}

                <MapContainer
                    center={center}
                    zoom={project?.latitude ? 15 : 4}
                    maxZoom={22}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <MapController />
                    <FitBounds
                        species={validSpecies.filter(s => s.latitude && s.longitude).map(s => ({ latitude: s.latitude!, longitude: s.longitude! }))}
                        projectCenter={project?.latitude && project?.longitude ? [project.latitude, project.longitude] : undefined}
                    />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url={getTileUrl()}
                        maxNativeZoom={19}
                        maxZoom={22}
                    />

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
                            fillColor={getMarkerColor(sp.especie?.created_by)}
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
                        <p className="text-gray-500 font-medium">Nenhum espécime com coordenadas neste projeto.</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Adicione coordenadas GPS ao registrar espécies.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
