import { MapPin, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSpecimens } from '../../hooks/useSpecimens';
import { SpecimenModal } from '../Modals/SpecimenModal';
import { ConfirmDeleteModal } from '../Modals/ConfirmDeleteModal';
import { useState } from 'react';

interface SpecimensTabProps {
    projectId: string;
}

export function SpecimensTab({ projectId }: SpecimensTabProps) {
    const { profile } = useAuth();
    const {
        specimens,
        loading,
        isModalOpen,
        setIsModalOpen,
        openNewModal,
        openEditModal,
        actionLoading,
        handleSave,
        handleDelete,
        formData,
        setFormData,
        editingSpecimen
    } = useSpecimens({ projectId });

    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Filter relevant fields for display
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Espécimes (Ocorrências)</h3>
                    <p className="text-sm text-gray-500">
                        Gerencie os registros físicos e georreferenciados deste projeto.
                    </p>
                </div>
                <button
                    onClick={openNewModal}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium"
                >
                    <Plus size={16} />
                    Adicionar Espécime
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Carregando espécimes...</div>
            ) : specimens.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                    <MapPin className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 font-medium">Nenhum espécime cadastrado.</p>
                    <p className="text-sm text-gray-400">Adicione ocorrências para vê-las no mapa.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-gray-700">Tombo (ID)</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Espécie</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Coletor</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Data</th>
                                <th className="px-6 py-3 font-semibold text-gray-700 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {specimens.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-gray-500">#{item.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {item.url_imagem && (
                                                <img src={item.url_imagem} alt="" className="w-8 h-8 rounded object-cover border border-gray-200" />
                                            )}
                                            <div>
                                                <p className="font-bold text-gray-900 italic">{item.nome_cientifico || 'Sem ID'}</p>
                                                <p className="text-xs text-gray-500">{item.familia_nome}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-xs">
                                            <span className="text-gray-900 font-medium">{item.coletor || '-'}</span>
                                            {item.numero_coletor && <span className="text-gray-500">Nº {item.numero_coletor}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {formatDate(item.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(item)}
                                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(item.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <SpecimenModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={() => handleSave(profile?.id || '', profile?.institution_id || '')}
                formData={formData}
                setFormData={setFormData}
                loading={actionLoading}
                isEdit={!!editingSpecimen}
                initialSpeciesName={editingSpecimen?.nome_cientifico}
            />

            <ConfirmDeleteModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={async () => {
                    if (deleteId) {
                        await handleDelete(deleteId);
                        setDeleteId(null);
                    }
                }}
                title="Excluir Espécime?"
                itemName={`Tombo #${deleteId}`}
                loading={actionLoading}
            />
        </div>
    );
}
