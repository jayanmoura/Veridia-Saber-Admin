import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../../components/Dashboard/StatCard';
import { BetaTestersModal } from '../../components/Modals/BetaTestersModal';
import { AnalyticsModal } from '../../components/Modals/AnalyticsModal';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    TreeDeciduous,
    Leaf,
    MapPin,
    Activity,
    BookOpen,
    Shield,
    Globe,
    Plus,
    BarChart3,
    Map as MapIcon
} from 'lucide-react';
import type { AuditLog, GlobalStats } from '../../hooks';

interface GlobalAdminViewProps {
    stats: GlobalStats;
    recentLogs: AuditLog[];
    loading: boolean;
}

// Helper
const getActionText = (action: string) => {
    switch (action) {
        case 'INSERT': return 'criou registro em';
        case 'UPDATE': return 'atualizou';
        case 'DELETE': return 'removeu de';
        default: return 'alterou';
    }
};

/**
 * Overview view for Curador Mestre and Coordenador Científico.
 */
export function GlobalAdminView({ stats, recentLogs, loading }: GlobalAdminViewProps) {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
    const [isBetaTestersModalOpen, setIsBetaTestersModalOpen] = useState(false);
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';

    const handleAuditClick = () => {
        if (profile?.role === 'Curador Mestre') {
            navigate('/seguranca/logs');
        } else {
            setShowAccessDeniedModal(true);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
                <p className="text-gray-500">Métricas globais do sistema Veridia Saber.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total de Famílias" value={stats.families} icon={TreeDeciduous} color="emerald" loading={loading} />
                <StatCard title="Total de Espécies" value={stats.species} icon={Leaf} color="blue" loading={loading} />

                <div className="relative">
                    <button
                        onClick={() => setIsBetaTestersModalOpen(true)}
                        className="absolute -top-8 right-0 text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 hover:underline transition-all"
                    >
                        <Plus size={14} /> Adicionar Beta Tester
                    </button>
                    <StatCard title="Projetos Cadastrados" value={stats.projects} icon={MapPin} color="purple" loading={loading} />
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Gestão Detalhada */}
                <div className="w-full lg:w-[70%] bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[300px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-emerald-600" />
                        Gestão Detalhada
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {profile?.role === 'Curador Mestre' && (
                            <NavLink
                                to="/conteudo-didatico"
                                className="flex flex-col items-center justify-center p-6 bg-emerald-50 border border-emerald-100 rounded-xl hover:shadow-md transition-all group"
                            >
                                <div className="p-3 bg-white rounded-full mb-3 group-hover:scale-110 transition-transform">
                                    <BookOpen className="text-emerald-600" size={24} />
                                </div>
                                <h4 className="font-semibold text-gray-800">Conteúdo do App</h4>
                                <p className="text-xs text-center text-gray-500 mt-1">Gerenciar textos educativos</p>
                            </NavLink>
                        )}

                        {profile?.role === 'Curador Mestre' && (
                            <div
                                onClick={handleAuditClick}
                                className="flex flex-col items-center justify-center p-6 bg-indigo-50 border border-indigo-100 rounded-xl hover:shadow-md transition-all group cursor-pointer"
                            >
                                <div className="p-3 bg-white rounded-full mb-3 group-hover:scale-110 transition-transform">
                                    <Shield className="text-indigo-600" size={24} />
                                </div>
                                <h4 className="font-semibold text-gray-800">Logs de Auditoria</h4>
                                <p className="text-xs text-center text-gray-500 mt-1">Monitorar segurança e acessos</p>
                            </div>
                        )}

                        {isGlobalAdmin && (
                            <>
                                <NavLink
                                    to="/mapa-global"
                                    className="flex flex-col items-center justify-center p-6 bg-teal-50 border border-teal-100 rounded-xl hover:shadow-md transition-all group"
                                >
                                    <div className="p-3 bg-white rounded-full mb-3 group-hover:scale-110 transition-transform">
                                        <Globe className="text-teal-600" size={24} />
                                    </div>
                                    <h4 className="font-semibold text-gray-800">Mapa Global</h4>
                                    <p className="text-xs text-center text-gray-500 mt-1">Distribuição de coletas</p>
                                </NavLink>

                                <NavLink
                                    to="/mapa-projetos"
                                    className="flex flex-col items-center justify-center p-6 bg-indigo-50 border border-indigo-100 rounded-xl hover:shadow-md transition-all group"
                                >
                                    <div className="p-3 bg-white rounded-full mb-3 group-hover:scale-110 transition-transform">
                                        <MapIcon className="text-indigo-600" size={24} />
                                    </div>
                                    <h4 className="font-semibold text-gray-800">Mapa dos Projetos</h4>
                                    <p className="text-xs text-center text-gray-500 mt-1">Visualizar acervos</p>
                                </NavLink>

                                <button
                                    onClick={() => setIsAnalyticsModalOpen(true)}
                                    className="flex flex-col items-center justify-center p-6 bg-cyan-50 border border-cyan-100 rounded-xl hover:shadow-md transition-all group"
                                >
                                    <div className="p-3 bg-white rounded-full mb-3 group-hover:scale-110 transition-transform">
                                        <BarChart3 className="text-cyan-600" size={24} />
                                    </div>
                                    <h4 className="font-semibold text-gray-800">Dados Analíticos</h4>
                                    <p className="text-xs text-center text-gray-500 mt-1">Métricas de uso do app</p>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Atividades recentes */}
                <div className="w-full lg:w-[30%] bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[300px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                        Atividades Recentes
                        {profile?.role === 'Curador Mestre' && (
                            <button onClick={handleAuditClick} className="text-xs text-emerald-600 hover:underline font-normal">
                                Ver tudo
                            </button>
                        )}
                    </h3>
                    {recentLogs.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">Nenhuma atividade recente.</p>
                    ) : (
                        <ul className="space-y-4">
                            {recentLogs.map(log => (
                                <li key={log.id} className="flex gap-3 text-sm">
                                    <div className={`
                                        w-2 h-2 rounded-full mt-1.5 shrink-0
                                        ${log.action_type === 'INSERT' ? 'bg-green-400' :
                                            log.action_type === 'DELETE' ? 'bg-red-400' : 'bg-blue-400'}
                                    `}></div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-600">
                                            <strong className="text-gray-800">
                                                {(Array.isArray(log.profiles) ? log.profiles[0]?.full_name : log.profiles?.full_name) || 'Desconhecido'}
                                            </strong> {getActionText(log.action_type)} <span className="font-mono text-xs bg-gray-100 px-1 rounded">{log.table_name}</span>
                                        </span>
                                        <span className="text-xs text-gray-400 mt-0.5">
                                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Access Denied Modal */}
            {showAccessDeniedModal && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                                <Shield className="text-orange-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h3>
                            <p className="text-gray-600 mb-6">
                                Esta área contém dados sensíveis de auditoria e é exclusiva para o perfil de <span className="font-medium text-gray-800">Curador Mestre</span>.
                            </p>
                            <button
                                onClick={() => setShowAccessDeniedModal(false)}
                                className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                            >
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <BetaTestersModal
                isOpen={isBetaTestersModalOpen}
                onClose={() => setIsBetaTestersModalOpen(false)}
            />

            <AnalyticsModal
                isOpen={isAnalyticsModalOpen}
                onClose={() => setIsAnalyticsModalOpen(false)}
            />
        </div>
    );
}
