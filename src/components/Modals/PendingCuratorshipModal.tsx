import { X, AlertTriangle, ImageIcon, FileText, Pencil, CheckCircle } from 'lucide-react';

interface PendingItem {
    id: string;
    nome_cientifico: string;
    descricao_especie?: string | null;
    imagens?: any[];
    familia?: { familia_nome: string } | null;
}

interface PendingCuratorshipModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: PendingItem[];
    onFix: (item: PendingItem) => void;
}

export function PendingCuratorshipModal({ isOpen, onClose, items, onFix }: PendingCuratorshipModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="text-orange-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Curadoria Necessária</h2>
                            <p className="text-sm text-gray-500">
                                {items.length} {items.length === 1 ? 'registro requer' : 'registros requerem'} atenção
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <CheckCircle className="text-emerald-500 mb-3" size={48} />
                            <h3 className="text-lg font-medium text-gray-900">Tudo Certo!</h3>
                            <p className="text-gray-500">O acervo global está completo.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 p-4">
                            {items.map((item) => {
                                const hasNoDesc = !item.descricao_especie || item.descricao_especie.trim() === '';
                                const hasNoImg = !item.imagens || item.imagens.length === 0;

                                return (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group">

                                        <div className="flex flex-1 items-center gap-6">
                                            {/* Identificação */}
                                            <div className="flex flex-col min-w-[30%]">
                                                <span className="font-bold text-gray-900 italic text-lg leading-tight">
                                                    {item.nome_cientifico}
                                                </span>
                                                {item.familia?.familia_nome && (
                                                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full w-fit mt-1">
                                                        {item.familia.familia_nome}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Badges (Centro) */}
                                            <div className="flex flex-wrap gap-2">
                                                {hasNoImg && (
                                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                                                        <ImageIcon size={14} /> Sem Foto
                                                    </span>
                                                )}
                                                {hasNoDesc && (
                                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                                                        <FileText size={14} /> Sem Descrição
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Ação (Direita) */}
                                        <button
                                            onClick={() => onFix(item)}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all font-semibold text-sm ml-4"
                                            title="Corrigir Registro"
                                        >
                                            <Pencil size={16} /> <span className="hidden sm:inline">Corrigir</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
