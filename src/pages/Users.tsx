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
    User,
    X,
    Loader2,
    Plus,
    Mail,
    CheckCircle
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

interface Project {
    id: string;
    nome: string;
}

interface UserStats {
    total: number;
    managers: number;
    taxonomists: number;
}

// Role hierarchy constants
const ALL_ROLES = [
    { value: 'Curador Mestre', label: 'Curador Mestre' },
    { value: 'Coordenador Científico', label: 'Coordenador Científico' },
    { value: 'Gestor de Acervo', label: 'Gestor de Acervo' },
    { value: 'Taxonomista', label: 'Taxonomista' },
    { value: 'Consulente', label: 'Consulente' },
];


export default function Users() {
    const { profile } = useAuth();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'managers' | 'taxonomists' | 'consultants'>('all');

    const [stats, setStats] = useState<UserStats>({ total: 0, managers: 0, taxonomists: 0 });

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [editRole, setEditRole] = useState('');
    const [editProjectId, setEditProjectId] = useState<string | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Invite Modal State (for Gestor)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Show toast notification
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Permission checks based on logged-in user's role
    const myRole = profile?.role;
    const myLocalId = profile?.local_id;
    const isCuradorMestre = myRole === 'Curador Mestre';
    const isCoordenadorCientifico = myRole === 'Coordenador Científico';
    const isGestorAcervo = myRole === 'Gestor de Acervo';

    // Access control: Only Curador, Coordenador, Gestor can access this page
    const hasAccess = isCuradorMestre || isCoordenadorCientifico || isGestorAcervo;

    // Check if a role is disabled based on hierarchy
    const isRoleDisabled = (roleValue: string): boolean => {
        // Curador Mestre can select any role
        if (isCuradorMestre) return false;

        // Coordenador cannot select Curador or Coordenador
        if (isCoordenadorCientifico) {
            return roleValue === 'Curador Mestre' || roleValue === 'Coordenador Científico';
        }

        // Gestor cannot select Curador, Coordenador, or Gestor
        if (isGestorAcervo) {
            return roleValue === 'Curador Mestre' || roleValue === 'Coordenador Científico' || roleValue === 'Gestor de Acervo';
        }

        return true; // Default: disable all
    };

    // Can the logged-in user edit/demote a specific user based on hierarchy?
    const canDeleteUser = (targetUser: Profile): boolean => {
        const targetRole = targetUser.role;

        // Curador Mestre can demote anyone (except themselves)
        if (isCuradorMestre) {
            return targetUser.id !== profile?.id;
        }

        // Coordenador can demote Gestor and Taxonomista (not Curador or other Coordenadores)
        if (isCoordenadorCientifico) {
            return targetRole === 'Gestor de Acervo' || (targetRole?.includes('Taxonomista') ?? false) || targetRole === 'Consulente';
        }

        // Gestor can demote Taxonomista and Consulente, but NOT other Gestores
        if (isGestorAcervo) {
            // Cannot edit/demote other Gestores (peers)
            if (targetRole === 'Gestor de Acervo') return false;
            return (targetRole?.includes('Taxonomista') ?? false) || targetRole === 'Consulente';
        }

        return false;
    };
    useEffect(() => {
        if (hasAccess) {
            fetchProfiles();
            fetchProjects();
        }
    }, [profile]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('profiles')
                .select('*, locais(nome)')
                .order('full_name');

            // Gestor de Acervo only sees users from their local
            if (isGestorAcervo && myLocalId) {
                query = query.eq('local_id', myLocalId);
            }

            const { data, error } = await query;

            if (error) throw error;

            setProfiles(data || []);
            calculateStats(data || []);

        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('locais')
                .select('id, nome')
                .order('nome');

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
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
        if (role === 'Coordenador Científico') return 'bg-violet-100 text-violet-800'; // Coordenadores
        if (role.includes('Gestor')) return 'bg-blue-100 text-blue-800'; // Gestores
        if (role.includes('Taxonomista')) return 'bg-emerald-100 text-emerald-800'; // Taxonomistas
        if (role === 'Consulente') return 'bg-orange-100 text-orange-800'; // Consulentes
        return 'bg-gray-100 text-gray-800';
    };

    // --- Edit Modal Functions ---
    const openEditModal = (user: Profile) => {
        setEditingUser(user);
        setEditRole(user.role || '');
        setEditProjectId(user.local_id);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingUser(null);
        setEditRole('');
        setEditProjectId(null);
    };

    const handleEditSave = async () => {
        if (!editingUser) return;

        // Validation: Coordenador MUST always assign a local
        if (isCoordenadorCientifico && !editProjectId) {
            alert('É obrigatório selecionar um local para o usuário.');
            return;
        }

        setEditLoading(true);
        try {
            const updateData: { role: string; local_id?: string | null } = { role: editRole };

            // Curador Mestre can set local_id freely (or null for global roles)
            // Coordenador/Gestor always send the selected local_id
            if (isCuradorMestre) {
                // For global roles, clear local_id; otherwise use selected value
                if (editRole === 'Curador Mestre' || editRole === 'Coordenador Científico') {
                    updateData.local_id = null;
                } else {
                    updateData.local_id = editProjectId;
                }
            } else {
                // Coordenador and Gestor always assign the selected local
                updateData.local_id = editProjectId;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', editingUser.id);

            if (error) throw error;

            closeEditModal();
            fetchProfiles(); // Refresh list
            showToast('Cargo atualizado com sucesso!');
        } catch (error: any) {
            console.error('Edit error:', error);
            showToast(error.message || 'Erro ao atualizar cargo.', 'error');
        } finally {
            setEditLoading(false);
        }
    };

    // --- Delete Modal Functions ---
    const openDeleteModal = (user: Profile) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        setDeleteLoading(true);
        closeDeleteModal();

        try {
            // Instead of deleting, demote user to Consulente
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'Consulente', local_id: null })
                .eq('id', userToDelete.id);

            if (error) throw error;

            // Update local state
            setProfiles(prev => prev.map(p =>
                p.id === userToDelete.id
                    ? { ...p, role: 'Consulente', local_id: null, locais: undefined }
                    : p
            ));
            showToast('Usuário rebaixado para Consulente com sucesso!');
        } catch (error: any) {
            console.error('Demote error:', error);
            showToast(error.message || 'Erro ao rebaixar usuário.', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Access denied for taxonomista/consulente
    if (!hasAccess) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertTriangle className="text-red-500" size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
                <p className="text-gray-500 max-w-md">
                    Esta área é restrita para Curadores Mestres, Coordenadores Científicos e Gestores de Acervo.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8 animate-fade-in-up">
                {/* Header & Metrics */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Membros</h1>
                    <p className="text-gray-500">Controle de acesso e equipe.</p>
                </div>

                {/* Stats Cards - Gestor only sees 2 cards, others see 3 */}
                <div className={`grid grid-cols-1 gap-6 ${isGestorAcervo ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                    <StatCard
                        title={isGestorAcervo ? 'Membros do Projeto' : 'Total de Membros'}
                        value={stats.total}
                        icon={UsersIcon}
                        color="blue"
                        loading={loading}
                    />
                    {!isGestorAcervo && (
                        <StatCard
                            title="Gestores de Acervo"
                            value={stats.managers}
                            icon={Briefcase}
                            color="indigo"
                            loading={loading}
                        />
                    )}
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
                    {/* Quick Filters - Gestor has fewer tabs */}
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {(isGestorAcervo ? [
                            { id: 'all', label: 'Todos' },
                            { id: 'taxonomists', label: 'Taxonomistas' }
                        ] : [
                            { id: 'all', label: 'Todos' },
                            { id: 'managers', label: 'Gestores' },
                            { id: 'taxonomists', label: 'Taxonomistas' },
                            { id: 'consultants', label: 'Consulentes' }
                        ]).map((tab) => (
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

                    {/* Right side: Search + Add button for Gestor */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar membro..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Add member button - visible to Gestor */}
                        {isGestorAcervo && (
                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">Adicionar</span>
                            </button>
                        )}
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
                                                    {/* Edit button - respects hierarchy */}
                                                    {canDeleteUser(user) && (
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Editar Cargo"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                    )}

                                                    {/* Demote button - respects hierarchy */}
                                                    {canDeleteUser(user) && (
                                                        <button
                                                            onClick={() => openDeleteModal(user)}
                                                            disabled={deleteLoading}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Rebaixar para Consulente"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
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

            {/* Edit Role Modal */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeEditModal}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                        {/* Close button */}
                        <button
                            onClick={closeEditModal}
                            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            {editingUser.avatar_url ? (
                                <img
                                    src={editingUser.avatar_url}
                                    alt={editingUser.full_name}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border-2 border-gray-200">
                                    <User size={24} />
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Editar Cargo</h3>
                                <p className="text-sm text-gray-500">{editingUser.full_name}</p>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            {/* Role Select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cargo
                                </label>
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                >
                                    <option value="">Selecione um cargo</option>
                                    {ALL_ROLES.map((role) => {
                                        const disabled = isRoleDisabled(role.value);
                                        return (
                                            <option
                                                key={role.value}
                                                value={role.value}
                                                disabled={disabled}
                                                className={disabled ? 'text-gray-400' : ''}
                                            >
                                                {role.label}{disabled ? ' 🔒' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Project/Local Select - visibility and mandatory rules based on logged user's role */}
                            {/* Curador: always shown (optional). Coordenador: always shown (mandatory). Gestor: shown for roles below them */}
                            {(isCuradorMestre || isCoordenadorCientifico || (isGestorAcervo && (editRole === 'Taxonomista' || editRole === 'Consulente'))) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Local / Projeto {isCoordenadorCientifico && <span className="text-red-500">*</span>}
                                    </label>
                                    <select
                                        value={editProjectId || ''}
                                        onChange={(e) => setEditProjectId(e.target.value || null)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                    >
                                        <option value="">Selecione um local</option>
                                        {projects.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.nome}
                                            </option>
                                        ))}
                                    </select>
                                    {isCoordenadorCientifico && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            É obrigatório vincular o usuário a um local.
                                        </p>
                                    )}
                                    {isCuradorMestre && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Opcional. Deixe vazio para cargos globais.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={closeEditModal}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEditSave}
                                disabled={editLoading || !editRole}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {editLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    'Salvar Alterações'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && userToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeDeleteModal}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="text-red-600" size={32} />
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            Rebaixar Usuário?
                        </h3>

                        {/* Description */}
                        <p className="text-gray-600 text-center mb-6">
                            Você tem certeza que deseja rebaixar{' '}
                            <strong className="text-gray-900">{userToDelete.full_name}</strong>{' '}
                            para <strong className="text-orange-600">Consulente</strong>?
                            <br />
                            <span className="text-sm text-gray-500">
                                O usuário perderá suas permissões atuais e vínculo com projetos.
                            </span>
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={closeDeleteModal}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Rebaixando...
                                    </>
                                ) : (
                                    'Sim, Rebaixar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Member Modal (for Gestor) */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsInviteModalOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                        {/* Close button */}
                        <button
                            onClick={() => setIsInviteModalOpen(false)}
                            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Adicionar Membro</h3>
                                <p className="text-sm text-gray-500">Convide um usuário para o projeto</p>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email do Usuário
                                </label>
                                <input
                                    type="email"
                                    placeholder="usuario@email.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    O usuário será vinculado ao seu projeto como Taxonomista.
                                </p>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsInviteModalOpen(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    // TODO: Implement invite logic
                                    console.log('Invite member:', inviteEmail);
                                    setInviteLoading(true);
                                    setTimeout(() => {
                                        setInviteLoading(false);
                                        setInviteEmail('');
                                        setIsInviteModalOpen(false);
                                        showToast('Funcionalidade de convite será implementada em breve.');
                                    }, 500);
                                }}
                                disabled={inviteLoading || !inviteEmail}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {inviteLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar Convite'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed top-5 right-5 z-[200] bg-white shadow-lg rounded-lg p-4 flex items-center gap-3 border-l-4 animate-fade-in-up ${toast.type === 'success' ? 'border-emerald-500' : 'border-red-500'
                        }`}
                    style={{ minWidth: '300px' }}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle className="text-emerald-500 flex-shrink-0" size={24} />
                    ) : (
                        <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
                    )}
                    <p className="text-gray-800 font-medium">{toast.message}</p>
                    <button
                        onClick={() => setToast(null)}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
        </>
    );
}
