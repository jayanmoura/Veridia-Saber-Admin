import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../../components/Dashboard/StatCard';
import {
    canManage,
    getRoleLevel,
    hasMinLevel,
    ROLES_CONFIG,
    ROLES_LIST,
    type UserRole,
} from '../../types/auth';
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
    CheckCircle,
    Lock
} from 'lucide-react';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: UserRole | null;
    avatar_url: string | null;
    local_id: string | null;
    locais?: { nome: string };
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

// Lista de cargos GLOBAIS (não precisam de local_id)
const GLOBAL_ROLES: UserRole[] = ['Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior'];

// Helper para verificar se um cargo é global
const isGlobalRole = (role: UserRole | ''): boolean => {
    if (!role) return false;
    return GLOBAL_ROLES.includes(role as UserRole);
};

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
    const [editRole, setEditRole] = useState<UserRole | ''>('');
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

    // ============================================
    // TAREFA 2 & 3: RBAC BASEADO EM NÍVEIS
    // ============================================
    const myRole = profile?.role;
    const myLocalId = profile?.local_id;
    const myLevel = getRoleLevel(myRole);

    // Acesso à página: níveis 1, 2, 4 (Curador, Coordenador, Gestor)
    // Taxonomista Sênior (3) e Taxonomista de Campo (5) NÃO têm acesso
    const hasAccess = hasMinLevel(myRole, 4) && myLevel !== 3 && myLevel !== 5;

    // TAREFA 3: Verifica se pode gerenciar um usuário alvo
    // Regra: Nível Logado < Nível Alvo (e não é si mesmo)
    const canManageUser = (targetUser: Profile): boolean => {
        if (targetUser.id === profile?.id) return false; // Não pode gerenciar a si mesmo
        return canManage(myRole, targetUser.role);
    };

    // TAREFA 3: Verifica se um cargo pode ser selecionado
    // Regra: Só pode selecionar cargos com nível MAIOR que o seu
    const isRoleDisabled = (roleValue: UserRole): boolean => {
        const targetLevel = getRoleLevel(roleValue);
        // Só pode atribuir cargos de nível MAIOR (número maior = menos poder)
        return targetLevel <= myLevel;
    };

    // TAREFA 4: Cores de badge baseadas em ROLES_CONFIG
    const getRoleBadgeStyle = (role: UserRole | null) => {
        if (!role) return { backgroundColor: '#F5F5F5', color: '#616161' };
        const config = ROLES_CONFIG[role];
        return {
            backgroundColor: config?.bgColor ?? '#F5F5F5',
            color: config?.color ?? '#616161',
        };
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

            // TAREFA 2: Gestor (nível 4) só vê usuários do seu local_id
            if (myLevel === 4 && myLocalId) {
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
        const managers = data.filter(u => u.role === 'Gestor de Acervo').length;
        const taxonomists = data.filter(u => u.role?.includes('Taxonomista')).length;
        setStats({ total, managers, taxonomists });
    };

    const filteredProfiles = profiles.filter(user => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (roleFilter === 'all') return true;
        if (roleFilter === 'managers') return user.role === 'Gestor de Acervo';
        if (roleFilter === 'taxonomists') return user.role?.includes('Taxonomista');
        if (roleFilter === 'consultants') return user.role === 'Consulente';

        return true;
    });

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

    // TAREFA 3: Verifica se o modal está em modo somente leitura
    const isReadOnly = editingUser ? !canManageUser(editingUser) : false;

    const handleEditSave = async () => {
        if (!editingUser || !editRole || isReadOnly) return;

        // Validação: Taxonomista de Campo precisa de local
        if (editRole === 'Taxonomista de Campo' && !editProjectId) {
            showToast('É obrigatório selecionar um local/projeto para Taxonomista de Campo.', 'error');
            return;
        }

        setEditLoading(true);
        try {
            const updateData: { role: UserRole; local_id: string | null } = {
                role: editRole,
                // TAREFA 3: Cargos globais SEMPRE têm local_id = null
                local_id: isGlobalRole(editRole) ? null : (editProjectId || null)
            };

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', editingUser.id);

            if (error) throw error;

            closeEditModal();
            fetchProfiles();
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
            // Rebaixa para Consulente ao invés de deletar
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'Consulente', local_id: null })
                .eq('id', userToDelete.id);

            if (error) throw error;

            setProfiles(prev => prev.map(p =>
                p.id === userToDelete.id
                    ? { ...p, role: 'Consulente' as UserRole, local_id: null, locais: undefined }
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

    // Acesso negado
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

                {/* Stats Cards */}
                <div className={`grid grid-cols-1 gap-6 ${myLevel === 4 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                    <StatCard
                        title={myLevel === 4 ? 'Membros do Projeto' : 'Total de Membros'}
                        value={stats.total}
                        icon={UsersIcon}
                        color="blue"
                        loading={loading}
                    />
                    {myLevel !== 4 && (
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
                    {/* Quick Filters */}
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {(myLevel === 4 ? [
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

                        {/* Add member button - visible to Gestor (level 4) */}
                        {myLevel === 4 && (
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
                                                {/* TAREFA 4: Badge com cores do ROLES_CONFIG */}
                                                <span
                                                    className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent"
                                                    style={getRoleBadgeStyle(user.role)}
                                                >
                                                    {user.role || 'Sem Cargo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">
                                                {/* Global roles show "Veridia Saber", others show project */}
                                                {getRoleLevel(user.role) <= 3 ? (
                                                    <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">
                                                        Veridia Saber
                                                    </span>
                                                ) : user.role === 'Gestor de Acervo' || user.role === 'Taxonomista de Campo' ? (
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
                                                    {/* TAREFA 2 & 3: Só mostra botões se canManageUser */}
                                                    {canManageUser(user) ? (
                                                        <>
                                                            <button
                                                                onClick={() => openEditModal(user)}
                                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                title="Editar Cargo"
                                                            >
                                                                <Pencil size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(user)}
                                                                disabled={deleteLoading}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Rebaixar para Consulente"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="p-2 text-gray-300" title="Sem permissão">
                                                            <Lock size={16} />
                                                        </span>
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
            {isEditModalOpen && editingUser && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeEditModal}
                    />

                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
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
                                <h3 className="text-lg font-bold text-gray-900">
                                    {isReadOnly ? 'Visualizar Cargo' : 'Editar Cargo'}
                                </h3>
                                <p className="text-sm text-gray-500">{editingUser.full_name}</p>
                            </div>
                        </div>

                        {/* TAREFA 3: Aviso de somente leitura */}
                        {isReadOnly && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-sm">
                                <Lock size={16} />
                                <span>Você não tem permissão para editar este usuário.</span>
                            </div>
                        )}

                        {/* Form */}
                        <div className="space-y-4">
                            {/* Role Select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cargo
                                </label>
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                                    disabled={isReadOnly}
                                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Selecione um cargo</option>
                                    {ROLES_LIST.map((role) => {
                                        const disabled = isRoleDisabled(role.value);
                                        return (
                                            <option
                                                key={role.value}
                                                value={role.value}
                                                disabled={disabled}
                                                className={disabled ? 'text-gray-400' : ''}
                                            >
                                                {role.label} (Nível {role.level}){disabled ? ' 🔒' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Project/Local Select */}
                            {hasMinLevel(myRole, 4) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Local / Projeto
                                        {editRole === 'Taxonomista de Campo' && <span className="text-red-500">*</span>}
                                        {editRole === 'Gestor de Acervo' && <span className="text-red-500">*</span>}
                                    </label>
                                    <select
                                        value={isGlobalRole(editRole) ? '' : (editProjectId || '')}
                                        onChange={(e) => setEditProjectId(e.target.value || null)}
                                        disabled={isReadOnly || isGlobalRole(editRole)}
                                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white ${(isReadOnly || isGlobalRole(editRole)) ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                                    >
                                        <option value="">
                                            {isGlobalRole(editRole) ? '🌐 Global (Veridia Saber)' : 'Selecione um local'}
                                        </option>
                                        {!isGlobalRole(editRole) && projects.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.nome}
                                            </option>
                                        ))}
                                    </select>
                                    {isGlobalRole(editRole) && (
                                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                            <span>✓</span> Cargos globais atuam em toda a plataforma Veridia Saber.
                                        </p>
                                    )}
                                    {(editRole === 'Taxonomista de Campo' || editRole === 'Gestor de Acervo') && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Obrigatório selecionar um local de atuação.
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
                                {isReadOnly ? 'Fechar' : 'Cancelar'}
                            </button>
                            {/* TAREFA 3: Botão desabilitado se isReadOnly */}
                            {!isReadOnly && (
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
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && userToDelete && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeDeleteModal}
                    />

                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="text-red-600" size={32} />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            Rebaixar Usuário?
                        </h3>

                        <p className="text-gray-600 text-center mb-6">
                            Você tem certeza que deseja rebaixar{' '}
                            <strong className="text-gray-900">{userToDelete.full_name}</strong>{' '}
                            para <strong className="text-orange-600">Consulente</strong>?
                            <br />
                            <span className="text-sm text-gray-500">
                                O usuário perderá suas permissões atuais e vínculo com projetos.
                            </span>
                        </p>

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
                </div>,
                document.body
            )}

            {/* Invite Member Modal (for Gestor) */}
            {isInviteModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsInviteModalOpen(false)}
                    />

                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                        <button
                            onClick={() => setIsInviteModalOpen(false)}
                            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Adicionar Membro</h3>
                                <p className="text-sm text-gray-500">Convide um usuário para o projeto</p>
                            </div>
                        </div>

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

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsInviteModalOpen(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
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
                </div>,
                document.body
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
