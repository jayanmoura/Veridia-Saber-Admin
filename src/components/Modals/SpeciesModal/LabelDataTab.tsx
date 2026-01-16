// LabelDataTab - Herbarium label data fields

// ============ TYPES ============
export interface LocalData {
    id?: number;
    descricao_ocorrencia: string;
    detalhes_localizacao: string;
    latitude: string;
    longitude: string;
    determinador: string;
    data_determinacao: string;
    coletor: string;
    numero_coletor: string;
    morfologia: string;
    habitat_ecologia: string;
}

export interface FamilyOption {
    id: string;
    familia_nome: string;
}

interface LabelDataTabProps {
    localData: LocalData;
    onLocalDataChange: (field: keyof LocalData, value: string) => void;
    formData: {
        nome_cientifico: string;
        autor?: string | null;
        familia_id: string;
    };
    families: FamilyOption[];
}

/**
 * Tab component for "Etiqueta de Herbário" (Herbarium Label) data.
 * Contains fields for collector, determiner, location, ecology, and morphology.
 */
export function LabelDataTab({
    localData,
    onLocalDataChange,
    formData,
    families
}: LabelDataTabProps) {
    const familyName = families.find(f => f.id === formData.familia_id)?.familia_nome || '';

    return (
        <div className="space-y-8">
            {/* Info Banner */}
            <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 flex items-start gap-3">
                <span className="text-emerald-600 mt-0.5 text-xl">📋</span>
                <div>
                    <h3 className="font-semibold text-emerald-900 text-sm">Editor de Etiqueta de Herbário</h3>
                    <p className="text-sm text-emerald-700 mt-1">
                        Preencha os dados necessários para a geração da etiqueta padrão (padrão científico).
                    </p>
                </div>
            </div>

            {/* 1. Identificação/Determinação */}
            <section className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 border-b pb-2 uppercase tracking-wide">
                    1. Identificação e Coleta
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Determinador (Quem identificou)
                        </label>
                        <input
                            type="text"
                            value={localData.determinador}
                            onChange={(e) => onLocalDataChange('determinador', e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Ex: Souza, J. M."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data da Determinação
                        </label>
                        <input
                            type="date"
                            value={localData.data_determinacao}
                            onChange={(e) => onLocalDataChange('data_determinacao', e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Coletor Principal
                        </label>
                        <input
                            type="text"
                            value={localData.coletor}
                            onChange={(e) => onLocalDataChange('coletor', e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Ex: Silva, A."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número do Coletor
                        </label>
                        <input
                            type="text"
                            value={localData.numero_coletor}
                            onChange={(e) => onLocalDataChange('numero_coletor', e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Ex: 1240"
                        />
                    </div>
                </div>
            </section>

            {/* 2. Localização */}
            <section className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 border-b pb-2 uppercase tracking-wide">
                    2. Localização
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Latitude (Decimal)
                        </label>
                        <input
                            type="number"
                            step="any"
                            value={localData.latitude}
                            onChange={(e) => onLocalDataChange('latitude', e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Longitude (Decimal)
                        </label>
                        <input
                            type="number"
                            step="any"
                            value={localData.longitude}
                            onChange={(e) => onLocalDataChange('longitude', e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição da Localização
                        <span className="text-xs font-normal text-gray-500 ml-2">
                            (País, província, localidade, ref. geográficas)
                        </span>
                    </label>
                    <textarea
                        value={localData.detalhes_localizacao}
                        onChange={(e) => onLocalDataChange('detalhes_localizacao', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        placeholder="Ex: Brasil, RJ, Mangaratiba. Próximo ao Rio Sahy, 500m da estrada principal."
                    />
                </div>
            </section>

            {/* 3. Ecologia e Morfologia */}
            <section className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 border-b pb-2 uppercase tracking-wide">
                    3. Ecologia e Descrição
                </h4>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Habitat e Ecologia
                        <span className="text-xs font-normal text-gray-500 ml-2">
                            (Tipo de vegetação, substrato, associadas, abundância)
                        </span>
                    </label>
                    <textarea
                        value={localData.habitat_ecologia}
                        onChange={(e) => onLocalDataChange('habitat_ecologia', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        placeholder="Ex: Floresta Ombrófila Densa. Solo argiloso. Espécie frequente no sub-bosque."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição Morfológica (Planta Fresca)
                        <span className="text-xs font-normal text-gray-500 ml-2">
                            (Hábito, cor, cheiro, dimensões, características perdidas na secagem)
                        </span>
                    </label>
                    <textarea
                        value={localData.morfologia}
                        onChange={(e) => onLocalDataChange('morfologia', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        placeholder="Ex: Arbusto de 2m. Flores brancas com aroma adocicado. Frutos imaturos verdes."
                    />
                </div>
            </section>

            {/* Preview Label (Mini) */}
            <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Pré-visualização Rápida</h4>
                <div className="font-serif text-sm leading-relaxed text-gray-800 border-l-4 border-emerald-500 pl-4 py-1">
                    <p>
                        <span className="font-bold italic">{formData.nome_cientifico}</span> {formData.autor}
                    </p>
                    <p className="text-xs uppercase text-gray-500 mb-1">{familyName}</p>
                    <p className="mb-1"><span className="font-semibold">Loc:</span> {localData.detalhes_localizacao}</p>
                    <p className="mb-1"><span className="font-semibold">Eco:</span> {localData.habitat_ecologia}</p>
                    <p className="mb-1"><span className="font-semibold">Des:</span> {localData.morfologia}</p>
                    <p className="mt-2 text-xs text-gray-600">
                        {localData.coletor} {localData.numero_coletor ? `nº ${localData.numero_coletor}` : ''}
                        {localData.data_determinacao ? ` (${new Date(localData.data_determinacao).toLocaleDateString()})` : ''}
                    </p>
                </div>
            </div>
        </div>
    );
}
