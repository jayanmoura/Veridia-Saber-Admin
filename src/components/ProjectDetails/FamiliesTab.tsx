import { TreeDeciduous, ArrowLeft } from 'lucide-react';

export interface LinkedFamily {
    id: number;
    familia_nome: string;
    speciesCount: number;
}

interface FamiliesTabProps {
    families: LinkedFamily[];
    onFamilyClick: (familyId: number, familyName: string) => void;
}

/**
 * Families tab content for ProjectDetails page.
 */
export function FamiliesTab({ families, onFamilyClick }: FamiliesTabProps) {
    if (families.length === 0) {
        return (
            <div className="col-span-full text-center py-12 text-gray-400">
                <TreeDeciduous size={48} className="mx-auto mb-3 opacity-50" />
                <p>Nenhuma família botânica presente neste projeto.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {families.map((family) => (
                <div
                    key={family.id}
                    onClick={() => onFamilyClick(family.id, family.familia_nome)}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                >
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors">
                        <TreeDeciduous size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900">{family.familia_nome}</p>
                        <p className="text-sm text-gray-500">
                            {family.speciesCount} {family.speciesCount === 1 ? 'espécie' : 'espécies'}
                        </p>
                    </div>
                    <div className="text-gray-400 group-hover:text-purple-600 transition-colors">
                        <ArrowLeft size={16} className="rotate-180" />
                    </div>
                </div>
            ))}
        </div>
    );
}
