import { useState } from 'react';
import { StatCard } from '../../components/Dashboard/StatCard';
import { SpeciesModalRefactored } from '../Modals/SpeciesModal/SpeciesModalRefactored';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Activity,
    Plus,
    Pencil,
    Award,
    Leaf,
    TreeDeciduous,
    Loader2
} from 'lucide-react';
import type { GlobalStats, RecentWorkItem } from '../../hooks';
import { useToast } from '../../hooks/useToast';
import { speciesRepo } from '../../services/speciesRepo';
import type { Species } from '../../types/domain';

interface FieldTaxonomistViewProps {
    stats: GlobalStats;
    recentWork: RecentWorkItem[];
    loading: boolean;
    refetch: () => Promise<void>;
}

/**
 * Overview view for Taxonomista de Campo.
 * Similar to SeniorView but without Nova Família action (RBAC restriction).
 */
export function FieldTaxonomistView({ stats, recentWork, loading, refetch }: FieldTaxonomistViewProps) {
    const { showToast } = useToast();
    const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
    const [editingWork, setEditingWork] = useState<Species | null>(null);
    const [loadingWorkId, setLoadingWorkId] = useState<string | null>(null);

    const handleNewSpecies = () => {
        setEditingWork(null);
        setIsSpeciesModalOpen(true);
    };

    const handleEditWork = async (work: RecentWorkItem) => {
        if (work.type !== 'especie') return;
        const itemKey = `${work.type}-${work.id}`;
        setLoadingWorkId(itemKey);
        try {
            const fullSpecies = await speciesRepo.getFullSpeciesForEdit(work.id);
            setEditingWork(fullSpecies);
            setIsSpeciesModalOpen(true);
        } catch (err) {
            console.error('Erro ao buscar espécie para edição:', err);
            showToast('Erro ao carregar dados da espécie.', 'error');
        } finally {
            setLoadingWorkId(null);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Meu Painel de Campo</h1>
                <p className="text-gray-500">Catalogação e gestão de espécies do projeto.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Minhas Contribuições" value={stats.seniorContributions || 0} icon={Award} color="emerald" loading={loading} />
                <StatCard title="Espécies no Projeto" value={stats.species} icon={Leaf} color="blue" loading={loading} />
                <StatCard title="Espécimes no Projeto" value={stats.specimens ?? 0} icon={TreeDeciduous} color="purple" loading={loading} />
            </div>

            {/* Quick Action - Only Nova Espécie (no Nova Família for field taxonomist) */}
            <div className="grid grid-cols-1 gap-6">
                <button
                    onClick={handleNewSpecies}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-xl shadow-sm transition-[transform,colors,box-shadow] transform hover:scale-[1.01] flex flex-col items-center justify-center gap-3 group"
                >
                    <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                        <Plus size={32} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold">Nova Espécie</h3>
                        <p className="text-emerald-100 text-sm">Adicionar ao catálogo do projeto</p>
                    </div>
                </button>
            </div>

            {/* Recent Work Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-gray-400" />
                    Meu Trabalho Recente
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <th className="px-4 py-3">Família</th>
                                <th className="px-4 py-3">Espécie</th>
                                <th className="px-4 py-3">Atualização</th>
                                <th className="px-4 py-3 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-8 w-8 bg-gray-100 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : recentWork.filter(w => w.type === 'especie').length > 0 ? (
                                recentWork.filter(w => w.type === 'especie').map((work) => (
                                    <tr key={`${work.type}-${work.id}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4 text-gray-600">
                                            {(Array.isArray(work.familia) ? work.familia[0]?.familia_nome : work.familia?.familia_nome) || '-'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="font-medium text-gray-900 italic">{work.nome_cientifico}</span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-400">
                                            {work.created_at ? formatDistanceToNow(new Date(work.created_at), { addSuffix: true, locale: ptBR }) : '-'}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                onClick={() => handleEditWork(work)}
                                                disabled={loadingWorkId === `${work.type}-${work.id}`}
                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Editar"
                                            >
                                                {loadingWorkId === `${work.type}-${work.id}` ? (
                                                    <Loader2 size={18} className="animate-spin text-emerald-600" />
                                                ) : (
                                                    <Pencil size={18} />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                                        Você ainda não cadastrou espécies neste projeto. Comece catalogando uma nova espécie!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <SpeciesModalRefactored
                isOpen={isSpeciesModalOpen}
                onClose={() => setIsSpeciesModalOpen(false)}
                onSave={refetch}
                initialData={editingWork}
            />
        </div>
    );
}
