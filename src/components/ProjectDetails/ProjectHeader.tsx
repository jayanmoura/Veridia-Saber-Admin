import {
    MapPin,
    Building2,
    Trees,
    Calendar,
    Leaf,
    FileText,
    Trash2,
    Loader2,
    Tag,
    FileSpreadsheet
} from 'lucide-react';

export interface ProjectDetails {
    id: string;
    nome: string;
    descricao: string | null;
    imagem_capa: string | null;
    tipo: string | null;
    created_at: string | null;
    latitude: number | null;
    longitude: number | null;
    especie?: { count: number }[];
}

interface ProjectHeaderProps {
    project: ProjectDetails;
    speciesCount: number;
    usersCount: number;

    // Actions
    onGenerateReport: () => void;
    onGenerateLabels: () => void;
    onExportCSV: () => void;
    onDelete: () => void;

    // Loading states
    genLabelsLoading: boolean;
    exportCSVLoading: boolean;
}

// Helper functions
const formatTipo = (tipo: string | null): string => {
    if (!tipo) return '';
    const normalized = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const tipoMap: Record<string, string> = {
        'instituicao': 'Instituição',
        'intituicao': 'Instituição',
        'parque': 'Parque',
        'reserva': 'Reserva',
        'jardim': 'Jardim',
    };
    return tipoMap[normalized] || tipo;
};

const isInstituicao = (tipo: string | null): boolean => {
    if (!tipo) return false;
    const normalized = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized === 'instituicao' || normalized === 'intituicao';
};

/**
 * Left column of ProjectDetails - shows project info, stats, and action buttons.
 */
export function ProjectHeader({
    project,
    speciesCount,
    usersCount,
    onGenerateReport,
    onGenerateLabels,
    onExportCSV,
    onDelete,
    genLabelsLoading,
    exportCSVLoading
}: ProjectHeaderProps) {
    return (
        <div className="lg:col-span-1 space-y-5">
            {/* A) Cover Image */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="relative h-56 bg-gray-100">
                    {project.imagem_capa ? (
                        <img
                            src={project.imagem_capa}
                            alt={project.nome}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <MapPin size={64} />
                        </div>
                    )}
                    {project.tipo && (
                        <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm shadow-sm rounded-full text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            {isInstituicao(project.tipo) ? <Building2 size={14} /> : <Trees size={14} />}
                            {formatTipo(project.tipo)}
                        </div>
                    )}
                </div>
            </div>

            {/* B) Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Leaf size={18} className="text-emerald-600" />
                    Estatísticas
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 px-4 py-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-emerald-700">{speciesCount}</p>
                        <p className="text-xs text-emerald-600">Espécies</p>
                    </div>
                    <div className="bg-blue-50 px-4 py-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-700">{usersCount}</p>
                        <p className="text-xs text-blue-600">Usuários</p>
                    </div>
                </div>
                {project.created_at && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm pt-2 border-t border-gray-100">
                        <Calendar size={14} />
                        <span>Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                )}
            </div>

            {/* C) Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Descrição</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                    {project.descricao || 'Nenhuma descrição cadastrada para este projeto.'}
                </p>
                {project.latitude && project.longitude && (
                    <div className="flex items-center gap-2 text-gray-500 text-xs mt-4 pt-3 border-t border-gray-100">
                        <MapPin size={12} />
                        <span>Lat: {project.latitude?.toFixed(4)}, Lng: {project.longitude?.toFixed(4)}</span>
                    </div>
                )}
            </div>

            {/* D) Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 mb-2">Ações</h3>
                <button
                    onClick={onGenerateReport}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <FileText size={16} />
                    Gerar Relatório
                </button>
                <button
                    onClick={onGenerateLabels}
                    disabled={genLabelsLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {genLabelsLoading ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
                    Etiquetas de Herbário
                </button>
                <button
                    onClick={onExportCSV}
                    disabled={exportCSVLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {exportCSVLoading ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                    Exportar CSV
                </button>

                <button
                    onClick={onDelete}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                    <Trash2 size={16} />
                    Excluir Projeto
                </button>
            </div>
        </div>
    );
}
