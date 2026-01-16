import { MapPin, Leaf, Building2, Trees, Pencil, Trash2, FileText } from 'lucide-react';

export interface ProjectItem {
    id: string;
    nome: string;
    descricao: string | null;
    imagem_capa: string | null;
    tipo: string | null;
    especie?: { count: number }[];
    quantidade_especies?: number;
}

interface ProjectCardProps {
    project: ProjectItem;
    onClick: () => void;
    onEdit: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onGenerateReport: (e: React.MouseEvent) => void;
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
 * Reusable project card component for the projects grid.
 */
export function ProjectCard({ project, onClick, onEdit, onDelete, onGenerateReport }: ProjectCardProps) {
    const speciesCount = project.quantidade_especies ?? project.especie?.[0]?.count ?? 0;

    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        >
            {/* Card Image */}
            <div className="relative h-48 bg-gray-100">
                {project.imagem_capa ? (
                    <img
                        src={project.imagem_capa}
                        alt={project.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <MapPin size={48} />
                    </div>
                )}

                {/* Tipo Badge */}
                {project.tipo && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 flex items-center gap-1.5 shadow-sm">
                        {isInstituicao(project.tipo) ? <Building2 size={12} /> : <Trees size={12} />}
                        {formatTipo(project.tipo)}
                    </div>
                )}

                {/* Species Count Badge */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-emerald-600 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <Leaf size={12} />
                    {speciesCount} espécies
                </div>

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onGenerateReport}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
                        title="Gerar Relatório"
                    >
                        <FileText size={14} />
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-600 hover:text-indigo-600 transition-colors"
                        title="Editar"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-600 hover:text-red-600 transition-colors"
                        title="Excluir"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
                <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                    {project.nome}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2 h-10">
                    {project.descricao || 'Sem descrição'}
                </p>
            </div>
        </div>
    );
}

interface ProjectsGridProps {
    projects: ProjectItem[];
    loading: boolean;
    onProjectClick: (project: ProjectItem) => void;
    onEdit: (project: ProjectItem) => void;
    onDelete: (project: ProjectItem) => void;
    onGenerateReport: (project: ProjectItem) => void;
}

/**
 * Grid container for displaying project cards.
 */
export function ProjectsGrid({ projects, loading, onProjectClick, onEdit, onDelete, onGenerateReport }: ProjectsGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 h-80 animate-pulse">
                        <div className="h-48 bg-gray-100 rounded-t-xl"></div>
                        <div className="p-4 space-y-3">
                            <div className="h-6 w-3/4 bg-gray-100 rounded"></div>
                            <div className="h-4 w-full bg-gray-100 rounded"></div>
                            <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum projeto encontrado</h3>
                <p className="text-gray-500">Tente ajustar os filtros de busca.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
                <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => onProjectClick(project)}
                    onEdit={(e) => { e.stopPropagation(); onEdit(project); }}
                    onDelete={(e) => { e.stopPropagation(); onDelete(project); }}
                    onGenerateReport={(e) => { e.stopPropagation(); onGenerateReport(project); }}
                />
            ))}
        </div>
    );
}
