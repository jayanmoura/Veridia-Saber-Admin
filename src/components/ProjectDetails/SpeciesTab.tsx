import { Leaf, Loader2, Tag } from 'lucide-react';

export interface LinkedSpecies {
    id: string;
    nome_cientifico: string | null;
    autor?: string | null;
    nome_popular: string | null;
    familia_id: number | null;
    familia?: { familia_nome: string } | null;
    imagem?: string | null;
}

interface SpeciesTabProps {
    species: LinkedSpecies[];
    singleLabelLoading: string | null;
    onGenerateSingleLabel: (species: LinkedSpecies) => void;
}

/**
 * Species tab content for ProjectDetails page.
 */
export function SpeciesTab({ species, singleLabelLoading, onGenerateSingleLabel }: SpeciesTabProps) {
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
                        {sp.imagem ? (
                            <img
                                src={sp.imagem}
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
                        <button
                            onClick={() => onGenerateSingleLabel(sp)}
                            disabled={singleLabelLoading === sp.id}
                            title="Gerar Etiqueta"
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                            {singleLabelLoading === sp.id ? (
                                <Loader2 size={18} className="animate-spin text-emerald-600" />
                            ) : (
                                <Tag size={18} />
                            )}
                        </button>
                        {sp.familia && (
                            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                                {(sp.familia as any).familia_nome}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
