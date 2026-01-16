import { TreeDeciduous, Pencil, Trash2, FileText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Family {
    id: string;
    familia_nome: string;
    imagem_referencia: string | null;
    quantidade_especies: number;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
}

interface FamilyTableProps {
    families: Family[];
    loading: boolean;
    totalCount: number;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onEdit: (family: Family) => void;
    onDelete: (family: Family) => void;
    onGenerateReport: (family: Family) => void;
    reportLoading: string | null;
    deleteLoading: string | null;
    canGenerateReports: boolean;
}

export function FamilyTable({
    families,
    loading,
    totalCount,
    page,
    totalPages,
    onPageChange,
    onEdit,
    onDelete,
    onGenerateReport,
    reportLoading,
    deleteLoading,
    canGenerateReports
}: FamilyTableProps) {
    const getCreatorName = (family: Family): string => {
        if (!family.creator) return 'Sistema';
        const creator = Array.isArray(family.creator) ? family.creator[0] : family.creator;
        return creator?.full_name || 'Sistema';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200">
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Capa</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome da Família</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Riqueza</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado por</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-lg"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-100 rounded ml-auto"></div></td>
                                </tr>
                            ))
                        ) : families.length > 0 ? (
                            families.map((family) => (
                                <tr key={family.id} className="group hover:bg-gray-50/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="w-10 h-10 flex-shrink-0 relative">
                                            {family.imagem_referencia ? (
                                                <img
                                                    src={family.imagem_referencia}
                                                    alt={family.familia_nome}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm peer"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const fallback = e.currentTarget.nextElementSibling;
                                                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 items-center justify-center text-emerald-600 absolute inset-0"
                                                style={{ display: family.imagem_referencia ? 'none' : 'flex' }}
                                            >
                                                <TreeDeciduous size={18} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                                            {family.familia_nome}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            {family.quantidade_especies}
                                            <span className="text-emerald-600/70">espécies</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {getCreatorName(family)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 justify-end">
                                            {canGenerateReports && (
                                                <button
                                                    onClick={() => onGenerateReport(family)}
                                                    disabled={reportLoading === family.id}
                                                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Gerar Relatório"
                                                >
                                                    {reportLoading === family.id ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onEdit(family)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(family)}
                                                disabled={deleteLoading === family.id}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Excluir"
                                            >
                                                {deleteLoading === family.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    Nenhuma família encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <span className="text-sm text-gray-500">
                        Mostrando {((page - 1) * 20) + 1} - {Math.min(page * 20, totalCount)} de {totalCount}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
