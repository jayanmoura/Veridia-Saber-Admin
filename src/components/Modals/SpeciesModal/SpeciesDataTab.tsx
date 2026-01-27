import { Loader2, Leaf } from 'lucide-react';

// ============ TYPES ============
export interface Species {
    id?: string;
    nome_cientifico: string;
    autor?: string | null;
    nome_popular?: string | null;
    familia_id: string;
    descricao_especie?: string | null;
    cuidados_luz?: string | null;
    cuidados_agua?: string | null;
    cuidados_temperatura?: string | null;
    cuidados_substrato?: string | null;
    cuidados_nutrientes?: string | null;
    local_id?: string | null;
}

export interface FamilyOption {
    id: string;
    familia_nome: string;
}

export interface LocalOption {
    id: string;
    nome: string;
}



interface SpeciesDataTabProps {
    formData: Species;
    onFormDataChange: <K extends keyof Species>(field: K, value: Species[K]) => void;


    // Options
    families: FamilyOption[];
    locais: LocalOption[];

    // Autocomplete
    suggestions: Species[];
    isSearching: boolean;
    showSuggestions: boolean;
    onNameChange: (value: string) => void;
    onSelectGlobalSpecies: (species: Species) => void;
    onClearSelection: () => void;
    onShowSuggestions: (show: boolean) => void;

    // Permissions
    userRole: string;
    isGlobalSpecies: boolean;
    isEditingExisting: boolean;
    shouldLockGlobalFields: boolean;
    isProjectUser: boolean;
    isSenior: boolean;
    getUserLocalName: () => string;


}

/**
 * Tab component for "Dados da Espécie" (Species Data).
 * Contains taxonomy fields, description, cultivation guide, and project notes.
 */
export function SpeciesDataTab({
    formData,
    onFormDataChange,

    families,
    locais,
    suggestions,
    isSearching,
    showSuggestions,
    onNameChange,
    onSelectGlobalSpecies,
    onClearSelection,
    onShowSuggestions,
    userRole,
    isGlobalSpecies,
    isEditingExisting,
    shouldLockGlobalFields,
    isProjectUser,
    isSenior,
    getUserLocalName,

}: SpeciesDataTabProps) {
    const isGlobalAdmin = userRole === 'Curador Mestre' || userRole === 'Coordenador Científico' || userRole === 'Taxonomista Sênior';

    return (
        <>
            {/* Section 1: Taxonomy */}
            <section>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Leaf size={16} className="text-emerald-600" />
                    Taxonomia e Identificação
                    {shouldLockGlobalFields && (
                        <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2">
                            🔒 Campos globais (somente leitura)
                        </span>
                    )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Family Select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Família <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.familia_id}
                            onChange={(e) => onFormDataChange('familia_id', e.target.value)}
                            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                            required
                            disabled={shouldLockGlobalFields}
                        >
                            <option value="">Selecione uma família...</option>
                            {families.map(fam => (
                                <option key={fam.id} value={fam.id}>{fam.familia_nome}</option>
                            ))}
                        </select>
                    </div>

                    {/* Local Select */}
                    {!isSenior && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Local de Ocorrência
                            </label>
                            {isGlobalAdmin ? (
                                <select
                                    value={formData.local_id || ''}
                                    onChange={(e) => onFormDataChange('local_id', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                                >
                                    <option value="">Veridia Saber BD (Global)</option>
                                    {locais.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.nome}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed">
                                    {getUserLocalName()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Scientific Name with Autocomplete */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome Científico <span className="text-red-500">*</span>
                            {isGlobalSpecies && (
                                <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-2">
                                    🔗 Espécie do catálogo global
                                </span>
                            )}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.nome_cientifico}
                                onChange={(e) => !shouldLockGlobalFields && onNameChange(e.target.value)}
                                onFocus={() => suggestions.length > 0 && onShowSuggestions(true)}
                                onBlur={() => setTimeout(() => onShowSuggestions(false), 200)}
                                className={`flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all italic ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder={isProjectUser ? "Digite para buscar ou criar nova..." : "Ex: Justicia brandegeeana"}
                                required
                                readOnly={shouldLockGlobalFields}
                            />
                            {isGlobalSpecies && (
                                <button
                                    type="button"
                                    onClick={onClearSelection}
                                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                    title="Limpar seleção"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Autocomplete Dropdown */}
                        {showSuggestions && !isEditingExisting && isProjectUser && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {isSearching ? (
                                    <div className="p-3 text-center text-gray-500 flex items-center justify-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        Buscando...
                                    </div>
                                ) : (
                                    <>
                                        <div className="px-3 py-2 bg-gray-50 border-b text-xs text-gray-500 font-medium">
                                            Espécies encontradas no catálogo global:
                                        </div>
                                        {suggestions.map((species) => (
                                            <button
                                                key={species.id}
                                                type="button"
                                                onClick={() => onSelectGlobalSpecies(species)}
                                                className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="font-medium text-gray-900 italic">
                                                    {species.nome_cientifico}
                                                </div>
                                                {species.nome_popular && (
                                                    <div className="text-sm text-gray-500">{species.nome_popular}</div>
                                                )}
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Common Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Popular</label>
                        <input
                            type="text"
                            value={formData.nome_popular || ''}
                            onChange={(e) => onFormDataChange('nome_popular', e.target.value)}
                            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Ex: Camarão-vermelho"
                            readOnly={shouldLockGlobalFields}
                        />
                    </div>

                    {/* Taxon Author */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Autor do Táxon</label>
                        <input
                            type="text"
                            value={formData.autor || ''}
                            onChange={(e) => onFormDataChange('autor', e.target.value)}
                            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-serif italic ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Ex: L., Vell., Mart."
                            readOnly={shouldLockGlobalFields}
                        />
                    </div>
                </div>
            </section>

            {/* Section 2: Description (Global) */}
            <section>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    Descrição Botânica
                    {shouldLockGlobalFields && (
                        <span className="text-xs font-normal text-gray-500">(Enciclopédia Veridia)</span>
                    )}
                </h3>
                <textarea
                    value={formData.descricao_especie || ''}
                    onChange={(e) => onFormDataChange('descricao_especie', e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Descreva as características morfológicas, habitat natural, curiosidades..."
                    readOnly={shouldLockGlobalFields}
                />
            </section>



            {/* Section 3: Cultivation Guide - Hidden for Project Users */}
            {!isProjectUser && (
                <section>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        Guia de Cultivo
                        {shouldLockGlobalFields && (
                            <span className="text-xs font-normal text-gray-500">(Enciclopédia Veridia)</span>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">☀️ Luminosidade</label>
                            <textarea
                                value={formData.cuidados_luz || ''}
                                onChange={(e) => onFormDataChange('cuidados_luz', e.target.value)}
                                rows={3}
                                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="Ex: Meia-sombra a sol pleno. Evitar luz direta intensa nas horas mais quentes do dia."
                                readOnly={shouldLockGlobalFields}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">💧 Rega</label>
                            <textarea
                                value={formData.cuidados_agua || ''}
                                onChange={(e) => onFormDataChange('cuidados_agua', e.target.value)}
                                rows={3}
                                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="Ex: Moderada. Manter o solo úmido mas não encharcado. Reduzir no inverno."
                                readOnly={shouldLockGlobalFields}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">🌡️ Temperatura</label>
                            <textarea
                                value={formData.cuidados_temperatura || ''}
                                onChange={(e) => onFormDataChange('cuidados_temperatura', e.target.value)}
                                rows={3}
                                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="Ex: 18°C a 28°C. Sensível a geadas. Proteger em invernos rigorosos."
                                readOnly={shouldLockGlobalFields}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">🌱 Substrato</label>
                            <textarea
                                value={formData.cuidados_substrato || ''}
                                onChange={(e) => onFormDataChange('cuidados_substrato', e.target.value)}
                                rows={3}
                                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="Ex: Rico em matéria orgânica, bem drenado."
                                readOnly={shouldLockGlobalFields}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">🧪 Nutrientes</label>
                            <textarea
                                value={formData.cuidados_nutrientes || ''}
                                onChange={(e) => onFormDataChange('cuidados_nutrientes', e.target.value)}
                                rows={3}
                                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="Ex: Adubar na primavera e verão com NPK balanceado."
                                readOnly={shouldLockGlobalFields}
                            />
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
