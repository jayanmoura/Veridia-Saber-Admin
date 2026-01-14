import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import {
    X,
    Loader2,
    Users,
    Leaf,
    FolderPlus,
    RefreshCw,
    BarChart3,
    Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface DailyActiveUser {
    date: string;
    active_users: number;
}



interface RecentEvent {
    id: string;
    event_type: string;
    platform: string | null;
    created_at: string;
    user_id: string | null;
    profiles?: { full_name: string } | { full_name: string }[] | null;
}

interface PlatformDistribution {
    platform: string;
    count: number;
}

type PeriodFilter = 7 | 30 | 90;

export function AnalyticsModal({ isOpen, onClose }: AnalyticsModalProps) {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<PeriodFilter>(30);

    // Metrics state
    const [activeUsersToday, setActiveUsersToday] = useState(0);
    const [plantsAddedWeek, setPlantsAddedWeek] = useState(0);
    const [collectionsMonth, setCollectionsMonth] = useState(0);
    const [syncRate, setSyncRate] = useState(0);

    // Chart data
    const [dailyActiveUsers, setDailyActiveUsers] = useState<DailyActiveUser[]>([]);
    const [platformDistribution, setPlatformDistribution] = useState<PlatformDistribution[]>([]);
    const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchAllData();
        }
    }, [isOpen, period]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchMetrics(),
                fetchDailyActiveUsers(),
                fetchPlatformDistribution(),
                fetchRecentEvents()
            ]);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMetrics = async () => {
        // Get start of today in local timezone, then convert to ISO string
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayStart = startOfToday.toISOString();

        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Active users today
        const { data: todayUsers, error: todayError } = await supabase
            .from('analytics_events')
            .select('user_id')
            .gte('created_at', todayStart)
            .not('user_id', 'is', null);

        if (todayError) {
            console.error('Error fetching today users:', todayError);
        }

        const uniqueTodayUsers = new Set(todayUsers?.map(e => e.user_id)).size;
        setActiveUsersToday(uniqueTodayUsers);

        // Plants added this week
        const { count: plantsCount } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'plant_added')
            .gte('created_at', weekAgo);

        setPlantsAddedWeek(plantsCount || 0);

        // Collections created this month
        const { count: collectionsCount } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'collection_created')
            .gte('created_at', monthAgo);

        setCollectionsMonth(collectionsCount || 0);

        // Sync rate
        const periodAgo = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();

        const { count: syncStarted } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'sync_started')
            .gte('created_at', periodAgo);

        const { count: syncCompleted } = await supabase
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'sync_completed')
            .gte('created_at', periodAgo);

        if (syncStarted && syncStarted > 0) {
            setSyncRate(Math.round(((syncCompleted || 0) / syncStarted) * 100));
        } else {
            setSyncRate(0);
        }
    };

    const fetchDailyActiveUsers = async () => {
        // Try using the view first
        const { data, error } = await supabase
            .from('analytics_daily_active_users')
            .select('*')
            .order('date', { ascending: true })
            .limit(period);

        if (!error && data) {
            setDailyActiveUsers(data);
        } else {
            // Fallback: calculate manually
            const periodAgo = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();
            const { data: events } = await supabase
                .from('analytics_events')
                .select('user_id, created_at')
                .gte('created_at', periodAgo)
                .not('user_id', 'is', null);

            if (events) {
                const dailyMap: { [key: string]: Set<string> } = {};
                events.forEach(e => {
                    const day = e.created_at.split('T')[0];
                    if (!dailyMap[day]) dailyMap[day] = new Set();
                    if (e.user_id) dailyMap[day].add(e.user_id);
                });

                const result = Object.entries(dailyMap)
                    .map(([date, users]) => ({ date, active_users: users.size }))
                    .sort((a, b) => a.date.localeCompare(b.date));

                setDailyActiveUsers(result);
            }
        }
    };

    const fetchPlatformDistribution = async () => {
        const periodAgo = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();

        const { data } = await supabase
            .from('analytics_events')
            .select('platform')
            .gte('created_at', periodAgo)
            .not('platform', 'is', null);

        if (data) {
            const counts: { [key: string]: number } = {};
            data.forEach(e => {
                const p = e.platform || 'unknown';
                counts[p] = (counts[p] || 0) + 1;
            });

            const result = Object.entries(counts)
                .map(([platform, count]) => ({ platform, count }))
                .sort((a, b) => b.count - a.count);

            setPlatformDistribution(result);
        }
    };

    const fetchRecentEvents = async () => {
        const { data } = await supabase
            .from('analytics_events')
            .select('id, event_type, platform, created_at, user_id, profiles:user_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(15);

        if (data) {
            setRecentEvents(data);
        }
    };

    const getEventTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            'login': 'Login',
            'logout': 'Logout',
            'signup': 'Cadastro',
            'collection_created': 'Coleção Criada',
            'collection_updated': 'Coleção Atualizada',
            'collection_deleted': 'Coleção Excluída',
            'plant_added': 'Planta Adicionada',
            'plant_updated': 'Planta Atualizada',
            'plant_deleted': 'Planta Excluída',
            'plant_photo_added': 'Foto Adicionada',
            'sync_started': 'Sync Iniciado',
            'sync_completed': 'Sync Concluído',
            'sync_failed': 'Sync Falhou',
            'offline_mode_entered': 'Modo Offline',
            'offline_mode_exited': 'Saiu do Offline',
            'offline_data_downloaded': 'Dados Baixados',
            'screen_view': 'Visualização de Tela',
            'error': 'Erro',
            'crash': 'Crash'
        };
        return labels[type] || type;
    };

    const getEventTypeColor = (type: string) => {
        if (type.includes('error') || type.includes('crash') || type.includes('failed')) return 'bg-red-100 text-red-700';
        if (type.includes('sync')) return 'bg-blue-100 text-blue-700';
        if (type.includes('plant') || type.includes('collection')) return 'bg-emerald-100 text-emerald-700';
        if (type.includes('login') || type.includes('signup')) return 'bg-purple-100 text-purple-700';
        if (type.includes('offline')) return 'bg-amber-100 text-amber-700';
        return 'bg-gray-100 text-gray-700';
    };

    const getPlatformIcon = (platform: string | null) => {
        if (platform === 'ios') return '🍎';
        if (platform === 'android') return '🤖';
        return '📱';
    };

    // Calculate max for bar chart scaling
    const maxActiveUsers = Math.max(...dailyActiveUsers.map(d => d.active_users), 1);

    // Calculate total for pie chart
    const totalPlatformEvents = platformDistribution.reduce((sum, p) => sum + p.count, 0);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-blue-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-100 rounded-lg">
                            <BarChart3 className="text-cyan-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Dados Analíticos</h2>
                            <p className="text-sm text-gray-500">Métricas de uso do app mobile</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Period Filter */}
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                            <Calendar size={16} className="text-gray-400 ml-2" />
                            {([7, 30, 90] as PeriodFilter[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === p
                                        ? 'bg-cyan-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {p}d
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-cyan-600 mb-4" size={48} />
                            <p className="text-gray-500">Carregando métricas...</p>
                        </div>
                    ) : (
                        <>
                            {/* Metric Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users size={18} className="text-blue-600" />
                                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Ativos Hoje</span>
                                    </div>
                                    <p className="text-3xl font-bold text-blue-900">{activeUsersToday}</p>
                                    <p className="text-xs text-blue-600/70 mt-1">usuários únicos</p>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Leaf size={18} className="text-emerald-600" />
                                        <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Plantas (7d)</span>
                                    </div>
                                    <p className="text-3xl font-bold text-emerald-900">{plantsAddedWeek}</p>
                                    <p className="text-xs text-emerald-600/70 mt-1">adicionadas</p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FolderPlus size={18} className="text-purple-600" />
                                        <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Coleções (30d)</span>
                                    </div>
                                    <p className="text-3xl font-bold text-purple-900">{collectionsMonth}</p>
                                    <p className="text-xs text-purple-600/70 mt-1">criadas</p>
                                </div>

                                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <RefreshCw size={18} className="text-amber-600" />
                                        <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Taxa Sync</span>
                                    </div>
                                    <p className="text-3xl font-bold text-amber-900">{syncRate}%</p>
                                    <p className="text-xs text-amber-600/70 mt-1">sucesso ({period}d)</p>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Bar Chart - Daily Active Users */}
                                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Usuários Ativos por Dia</h3>
                                    {dailyActiveUsers.length === 0 ? (
                                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                                            Nenhum dado disponível
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                            {dailyActiveUsers.slice(-14).map((day) => (
                                                <div key={day.date} className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500 w-20 shrink-0">
                                                        {format(new Date(day.date), 'dd/MM', { locale: ptBR })}
                                                    </span>
                                                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${(day.active_users / maxActiveUsers) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-700 w-8 text-right">
                                                        {day.active_users}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Pie Chart - Platform Distribution */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribuição por Plataforma</h3>
                                    {platformDistribution.length === 0 ? (
                                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                                            Nenhum dado disponível
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            {/* Simple SVG Pie Chart */}
                                            <svg viewBox="0 0 100 100" className="w-32 h-32 mb-4">
                                                {platformDistribution.reduce((acc, platform, index) => {
                                                    const percentage = (platform.count / totalPlatformEvents) * 100;
                                                    const previousPercentage = acc.offset;
                                                    const color = index === 0 ? '#06B6D4' : index === 1 ? '#10B981' : '#8B5CF6';

                                                    acc.elements.push(
                                                        <circle
                                                            key={platform.platform}
                                                            r="25"
                                                            cx="50"
                                                            cy="50"
                                                            fill="transparent"
                                                            stroke={color}
                                                            strokeWidth="50"
                                                            strokeDasharray={`${percentage} ${100 - percentage}`}
                                                            strokeDashoffset={-previousPercentage}
                                                            transform="rotate(-90 50 50)"
                                                        />
                                                    );
                                                    acc.offset += percentage;
                                                    return acc;
                                                }, { elements: [] as React.ReactElement[], offset: 0 }).elements}
                                            </svg>

                                            {/* Legend */}
                                            <div className="space-y-2 w-full">
                                                {platformDistribution.map((platform, index) => (
                                                    <div key={platform.platform} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: index === 0 ? '#06B6D4' : index === 1 ? '#10B981' : '#8B5CF6' }}
                                                            />
                                                            <span className="text-sm text-gray-600">
                                                                {getPlatformIcon(platform.platform)} {platform.platform}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-800">
                                                            {Math.round((platform.count / totalPlatformEvents) * 100)}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Events Table */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <h3 className="text-sm font-semibold text-gray-700">Eventos Recentes</h3>
                                </div>
                                {recentEvents.length === 0 ? (
                                    <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                                        Nenhum evento registrado
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                                <tr>
                                                    <th className="text-left px-4 py-3">Data/Hora</th>
                                                    <th className="text-left px-4 py-3">Evento</th>
                                                    <th className="text-left px-4 py-3">Usuário</th>
                                                    <th className="text-left px-4 py-3">Plataforma</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {recentEvents.map((event) => (
                                                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 text-gray-600">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">
                                                                    {format(new Date(event.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    {format(new Date(event.created_at), 'HH:mm:ss')}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                                                                {getEventTypeLabel(event.event_type)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {(Array.isArray(event.profiles) ? event.profiles[0]?.full_name : event.profiles?.full_name) || (
                                                                <span className="text-gray-400 italic">Anônimo</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-1 text-gray-600">
                                                                {getPlatformIcon(event.platform)}
                                                                <span className="capitalize">{event.platform || 'N/A'}</span>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
