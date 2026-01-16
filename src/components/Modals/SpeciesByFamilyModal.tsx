import { createPortal } from 'react-dom';
import { TreeDeciduous, Leaf, Loader2, X } from 'lucide-react';

export interface ModalSpecies {
    id: string;
    nome_cientifico: string | null;
    nome_popular: string | null;
}

interface SpeciesByFamilyModalProps {
    isOpen: boolean;
    onClose: () => void;
    familyName: string;
    species: ModalSpecies[];
    loading: boolean;
}

/**
 * Modal to display species belonging to a specific family.
 * Used in ProjectDetails when clicking on a family.
 */
export function SpeciesByFamilyModal({ isOpen, onClose, familyName, species, loading }: SpeciesByFamilyModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                            <TreeDeciduous size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Espécies de {familyName}</h2>
                            <p className="text-sm text-gray-500">{species.length} espécie(s) encontrada(s)</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-emerald-600" size={32} />
                        </div>
                    ) : species.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Leaf size={48} className="mx-auto mb-3 opacity-50" />
                            <p>Nenhuma espécie encontrada para esta família.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {species.map((sp) => (
                                <div
                                    key={sp.id}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <Leaf size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 italic truncate">
                                            {sp.nome_cientifico || 'Sem nome científico'}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {sp.nome_popular || 'Nome popular não informado'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
