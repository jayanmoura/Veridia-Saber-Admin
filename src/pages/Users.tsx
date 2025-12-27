import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { StatCard } from '../components/Dashboard/StatCard';
import {
    Users as UsersIcon,
    Briefcase,
    UserCheck,
    Search,
    Pencil,
    Trash2,
    AlertTriangle,
    User
} from 'lucide-react';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: string | null;
    avatar_url: string | null;
    local_id: string | null;
    locais?: { nome: string }; // Relation
}

interface UserStats {
    total: number;
    managers: number;
    taxonomists: number;
}

export default function Users() {
    const { profile } = useAuth();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'managers' | 'taxonomists' | 'consultants'>('all');

    const [stats, setStats] = useState<UserStats>({ total: 0, managers: 0, taxonomists: 0 });

    // Permissions Check: Only Global Admins
    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';

    useEffect(() => {
        if (isGlobalAdmin) fetchProfiles();
    }, [profile]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*, locais(nome)')
                .order('full_name');

            if (error) throw error;

            setProfiles(data || []);
            calculateStats(data || []);

        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: Profile[]) => {
        const total = data.length;

        // Exact match for "Gestor de Acervo" (assuming exact string from prompt context, usually "Gestor")
        const managers = data.filter(u => u.role === 'Gestor de Acervo' || u.role?.includes('Gestor')).length;

        // Contains "Taxonomista"
        const taxonomists = data.filter(u => u.role?.includes('Taxonomista')).length;

        setStats({ total, managers, taxonomists });
    };

    const filteredProfiles = profiles.filter(user => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (roleFilter === 'all') return true;
        if (roleFilter === 'managers') return user.role === 'Gestor de Acervo' || user.role?.includes('Gestor');
        if (roleFilter === 'taxonomists') return user.role?.includes('Taxonomista');
        if (roleFilter === 'consultants') return user.role === 'Consulente';

        return true;
    });

    const getRoleBadgeColor = (role: string | null) => {
        if (!role) return 'bg-gray-100 text-gray-800';
        if (role.toLowerCase().includes('admin') || role === 'Curador Mestre') return 'bg-purple-100 text-purple-800'; // Curadores
        if (role.includes('Gestor')) return 'bg-blue-100 text-blue-800'; // Gestores
        if (role.includes('Taxonomista')) return 'bg-emerald-100 text-emerald-800'; // Taxonomistas
        if (role === 'Consulente') return 'bg-orange-100 text-orange-800'; // Consulentes
        return 'bg-gray-100 text-gray-800';
    };

    if (!isGlobalAdmin) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertTriangle className="text-red-500" size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
                <p className="text-gray-500 max-w-md">
                    Esta área é restrita para Curadores Mestres e Coordenadores Científicos.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header & Metrics */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Membros</h1>
                <p className="text-gray-500">Controle de acesso e equipe.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total de Membros"
                    value={stats.total}
                    icon={UsersIcon}
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="Gestores de Acervo"
                    value={stats.managers}
                    icon={Briefcase}
                    color="indigo"
                    loading={loading}
                />
                <StatCard
                    title="Equipe Taxonômica"
                    value={stats.taxonomists}
                    icon={UserCheck}
                    color="emerald"
                    loading={loading}
                />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                {/* Quick Filters */}
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'managers', label: 'Gestores' },
                        { id: 'taxonomists', label: 'Taxonomistas' },
                        { id: 'consultants', label: 'Consulentes' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setRoleFilter(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${roleFilter === tab.id
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar membro..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargo</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Projeto / Contexto</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="h-10 w-10 bg-gray-100 rounded-full"></div><div className="h-4 w-32 bg-gray-100 rounded"></div></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-100 rounded-full"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 w-16 bg-gray-100 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredProfiles.length > 0 ? (
                                filteredProfiles.map((user) => (
                                    <tr key={user.id} className="group hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
                                                        <User size={18} />
                                                    </div>
                                                )}
                                                <span className="font-semibold text-gray-900">{user.full_name || 'Usuário sem nome'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium font-mono text-sm">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${getRoleBadgeColor(user.role)}`}>
                                                {user.role || 'Sem Cargo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {/* Logic: Global Chiefs -> Veridia Saber. Managers -> Project/Warning. Others -> - */}
                                            {(user.role === 'Curador Mestre' || user.role === 'Coordenador Científico') ? (
                                                <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">
                                                    Veridia Saber
                                                </span>
                                            ) : user.role === 'Gestor de Acervo' ? (
                                                user.locais?.nome ? (
                                                    <div className="flex items-center gap-1.5 text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded w-fit">
                                                        <Briefcase size={14} />
                                                        {user.locais.nome}
                                                    </div>
                                                ) : (
                                                    <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 w-fit border border-red-100">
                                                        <AlertTriangle size={12} />
                                                        Sem Lotação
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar Cargo">
                                                    <Pencil size={18} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Nenhum membro encontrado com este filtro.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
