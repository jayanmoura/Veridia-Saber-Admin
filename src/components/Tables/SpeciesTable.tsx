import { Leaf, FileText, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export interface SpeciesItem {
    id: string;
    nome_cientifico: string;
    nome_popular: string | null;
    familia?: { familia_nome: string };
    imagens?: { url_imagem: string }[];
    created_by_name?: string | null;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
}

interface SpeciesTableProps {
    species: SpeciesItem[];
    loading: boolean;
    totalCount: number;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;

    onEdit: (species: SpeciesItem) => void;
    onDelete: (species: SpeciesItem) => void;
    onGenerateReport?: (speciesId: string) => void;

    // Loading states for individual items
    singleReportLoading?: string | null;
    deleteLoading?: boolean;

    onViewSpecimens?: (speciesId: string) => void;
    // Permissions
    canGenerateReports?: boolean;
}

/**
 * Reusable species table component with pagination and actions.
 */
export function SpeciesTable({
    species,
    loading,
    totalCount,
    page,
    totalPages,
    onPageChange,
    onEdit,
    onDelete,
    onGenerateReport,
    singleReportLoading,
    deleteLoading = false,
    canGenerateReports = false,
    onViewSpecimens
}: SpeciesTableProps) {
    const getCreatorName = (specie: SpeciesItem) => {
        // First try creator from join
        const c = Array.isArray(specie.creator) ? specie.creator[0] : specie.creator;
        if (c?.full_name) return c.full_name;
        if (c?.email) return c.email.split('@')[0];
        // Fallback to stored name (preserved even if user deleted)
        if (specie.created_by_name) return specie.created_by_name;
        // Final fallback
        return 'Sistema';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200">
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Foto</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Família</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Espécie</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado por</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-md"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-100 rounded ml-auto"></div></td>
                                </tr>
                            ))
                        ) : species.length > 0 ? (
                            species.map((specie) => {
                                const imageUrl = specie.imagens?.[0]?.url_imagem;

                                return (
                                    <tr key={specie.id} className="group hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            {imageUrl ? (
                                                <img src={imageUrl} alt={specie.nome_cientifico} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <Leaf size={18} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {specie.familia?.familia_nome || '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 italic">
                                            {specie.nome_cientifico}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {getCreatorName(specie)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {canGenerateReports && onGenerateReport && (
                                                    <button
                                                        onClick={() => onGenerateReport(specie.id)}
                                                        disabled={singleReportLoading === specie.id}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Ficha Técnica"
                                                    >
                                                        {singleReportLoading === specie.id ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                                                    </button>
                                                )}

                                                {onViewSpecimens && (
                                                    <button
                                                        onClick={() => onViewSpecimens(specie.id)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Ver Espécimes"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}



                                                <button
                                                    onClick={() => onEdit(specie)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(specie)}
                                                    disabled={deleteLoading}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    Nenhuma espécie encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <p className="text-sm text-gray-500">
                    Mostrando <span className="font-medium text-gray-900">{species.length}</span> de <span className="font-medium text-gray-900">{totalCount}</span>
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1 || loading}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} className="text-gray-600" />
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                        Página {page} de {totalPages || 1}
                    </span>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages || loading}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} className="text-gray-600" />
                    </button>
                </div>
            </div>
        </div>
    );
}
