import { NavLink } from 'react-router-dom';
import { StatCard } from '../../components/Dashboard/StatCard';
import { TreeDeciduous, Leaf } from 'lucide-react';
import type { GlobalStats } from '../../hooks';

interface CatalogerViewProps {
    stats: GlobalStats;
    loading: boolean;
}

/**
 * Overview view for Consulente/Taxonomista (basic cataloger role).
 */
export function CatalogerView({ stats, loading }: CatalogerViewProps) {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Meu Painel</h1>
                <p className="text-gray-500">Suas contribuições para o acervo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="Minhas Famílias Identificadas" value={stats.families} icon={TreeDeciduous} color="blue" loading={loading} />
                <StatCard title="Minhas Espécies Cadastradas" value={stats.species} icon={Leaf} color="emerald" loading={loading} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 h-64 flex flex-col items-center justify-center text-center">
                <Leaf size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-500">Selecione "Espécies" na barra lateral para começar a catalogar.</p>
                <NavLink to="/species" className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Ir para Catalogação
                </NavLink>
            </div>
        </div>
    );
}
