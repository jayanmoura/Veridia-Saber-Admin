import { Leaf, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

export interface LinkedSpecies {
    id: string;
    nome_cientifico: string | null;
    autor?: string | null;
    nome_popular: string | null;
    familia_id: number | null;
    familia?: { familia_nome: string } | null;
    imagem?: string | null;        // url_micro (preferencial para listagem)
    imagem_thumbnail?: string | null;
    imagem_original?: string | null;
    specimens?: {
        id: string | number;
        tombo_codigo: string | null;
        created_at: string | null;
        url_imagem: string | null;
    }[];
}

interface SpeciesTabProps {
    species: LinkedSpecies[];
}

/**
 * Species tab content for ProjectDetails page.
 */
export function SpeciesTab({ species }: SpeciesTabProps) {
    const [selectedSpeciesForModal, setSelectedSpeciesForModal] = useState<LinkedSpecies | null>(null);

    if (species.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <Leaf size={48} className="mx-auto mb-3 opacity-50" />
                <p>Nenhuma espécie cadastrada neste projeto.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {species.map((sp) => (
                <div
                    key={sp.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        {/* Cover Image or Placeholder */}
                        {(sp.imagem || sp.imagem_thumbnail || sp.imagem_original) ? (
                            <img
                                src={sp.imagem || sp.imagem_thumbnail || sp.imagem_original || ''}
                                alt={sp.nome_cientifico || 'Espécie'}
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Leaf size={24} />
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-gray-900 italic">
                                {sp.nome_cientifico || 'Sem nome científico'}
                            </p>
                            <p className="text-sm text-gray-500">
                                {sp.nome_popular || 'Nome popular não informado'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {sp.specimens && sp.specimens.length > 1 && (
                            <button
                                onClick={() => setSelectedSpeciesForModal(sp)}
                                className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full text-xs font-medium cursor-pointer transition-colors"
                            >
                                {sp.specimens.length} espécimes
                            </button>
                        )}
                        {sp.familia && (
                            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                                {(sp.familia as any).familia_nome}
                            </span>
                        )}
                    </div>
                </div>
            ))}

            {selectedSpeciesForModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedSpeciesForModal(null)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">
                                Espécimes de {selectedSpeciesForModal.nome_cientifico}
                            </h3>
                            <button onClick={() => setSelectedSpeciesForModal(null)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <div className="space-y-3">
                            {selectedSpeciesForModal.specimens?.map(specimen => (
                                <div key={specimen.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {specimen.url_imagem ? (
                                            <img src={specimen.url_imagem} className="w-10 h-10 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Leaf size={16} className="text-gray-400" /></div>
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{specimen.tombo_codigo || specimen.id}</p>
                                            <p className="text-xs text-gray-500">Coletado em {specimen.created_at ? new Date(specimen.created_at).toLocaleDateString('pt-BR') : '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => window.location.href = `/specimens?search=${specimen.id}`}
                                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                            title="Editar na gestão global"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => window.location.href = `/specimens?search=${specimen.id}`}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            title="Excluir na gestão global"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
