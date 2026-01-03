import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../../components/Dashboard/StatCard';
import { Leaf, TreeDeciduous, MapPin, Activity, BookOpen, Shield, Globe, Award, AlertTriangle, Plus, Pencil, CheckCircle } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { SpeciesModal } from '../../components/Modals/SpeciesModal';
import { FamilyModal } from '../../components/Modals/FamilyModal';
import { PendingCuratorshipModal } from '../../components/Modals/PendingCuratorshipModal';
import { BetaTestersModal } from '../../components/Modals/BetaTestersModal';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
    id: number;
    created_at: string;
    action_type: string;
    table_name: string;
    user_id: string;
    profiles?: { full_name: string } | { full_name: string }[];
}

// Discriminated union type for recent work items
interface RecentSpecies {
    type: 'especie';
    id: string;
    nome_cientifico: string;
    created_at: string;
    local_id: string | null;
    familia_id: string | null;
    familia?: { familia_nome: string }[] | { familia_nome: string } | null;
    created_by?: string | null;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
}

interface RecentFamily {
    type: 'familia';
    id: string;
    familia_nome: string;
    created_at: string;
    created_by?: string | null;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
}

type RecentWorkItem = RecentSpecies | RecentFamily;

export default function Overview() {
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);

    const handleAuditClick = () => {
        if (profile?.role === 'Curador Mestre') {
            navigate('/seguranca/logs');
        } else {
            setShowAccessDeniedModal(true);
        }
    };

    const [stats, setStats] = useState({
        families: 0,
        species: 0,
        projects: 0,
        users: 0,
        seniorContributions: 0,
        seniorPending: 0
    });
    const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
    const [recentWork, setRecentWork] = useState<RecentWorkItem[]>([]);
    const [pendingSpecies, setPendingSpecies] = useState<any[]>([]);

    // Senior Taxonomist Modal State
    const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [isBetaTestersModalOpen, setIsBetaTestersModalOpen] = useState(false);
    const [editingWork, setEditingWork] = useState<any>(null);

    const handleNewSpecies = () => {
        setEditingWork(null);
        setIsSpeciesModalOpen(true);
    };

    const [editingFamily, setEditingFamily] = useState<any>(null);

    const handleEditWork = (work: RecentWorkItem) => {
        if (work.type === 'familia') {
            // Open family modal for families
            setEditingFamily(work);
            setIsFamilyModalOpen(true);
        } else {
            // Open species modal for species
            setEditingWork(work);
            setIsSpeciesModalOpen(true);
        }
    };

    const [loading, setLoading] = useState(true);

    // Derived check for simplified logic
    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';
    const isLocalAdmin = profile?.role === 'Gestor de Acervo';
    const isSenior = profile?.role === 'Taxonomista Sênior';
    // 'Taxonomista' (old) or Consulente
    const isCataloger = (profile?.role?.includes('Taxonomista') && !isSenior) || profile?.role === 'Consulente';

    useEffect(() => {
        if (profile) fetchStats();
    }, [profile]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            if (isGlobalAdmin) {
                await fetchGlobalStats();
            } else if (isLocalAdmin) {
                await fetchLocalStats();
            } else if (isSenior) {
                await fetchSeniorStats();
            } else if (isCataloger) {
                await fetchPersonalStats();
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGlobalStats = async () => {
        // Queries updated to match actual DB table names (Portuguese)
        const [families, species, projects, users, logs] = await Promise.all([
            supabase.from('familia').select('*', { count: 'exact', head: true }),
            supabase.from('especie').select('*', { count: 'exact', head: true }),
            supabase.from('locais').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('audit_logs')
                .select('id, created_at, action_type, table_name, user_id, profiles:user_id(full_name)')
                .order('created_at', { ascending: false })
                .limit(5)
        ]);

        setStats(prev => ({
            ...prev,
            families: families.count || 0,
            species: species.count || 0,
            projects: projects.count || 0,
            users: users.count || 0,
        }));

        if (logs.data) {
            setRecentLogs(logs.data);
        }
    };

    const fetchSeniorStats = async () => {
        // 1. My contributions (created_by me) - count both species AND families
        const [mySpeciesCount, myFamiliesCount] = await Promise.all([
            supabase
                .from('especie')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', profile?.id || ''),
            supabase
                .from('familia')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', profile?.id || '')
        ]);

        const myCount = (mySpeciesCount.count || 0) + (myFamiliesCount.count || 0);

        // 2. Global Total
        const { count: globalCount } = await supabase
            .from('especie')
            .select('*', { count: 'exact', head: true });

        // 3. Pending Review (Curadoria Necessária)
        // Fetch all global species to check description and images
        const { data: globalSpecies } = await supabase
            .from('especie')
            .select('id, nome_cientifico, descricao_especie, imagens(id), familia(familia_nome)')
            .is('local_id', null);

        let pendingCount = 0;
        if (globalSpecies) {
            const pending = globalSpecies.filter(sp => {
                const hasNoDesc = !sp.descricao_especie || sp.descricao_especie.trim() === '';
                const hasNoImg = !sp.imagens || sp.imagens.length === 0;
                return hasNoDesc || hasNoImg;
            });
            pendingCount = pending.length;
            // Need to fetch full details for pending items if we want to edit them immediately? 
            // The modal lists them, and "Fix" click opens standard "Edit" modal. 
            // The standard edit modal needs MORE fields than just what we fetched (id, desc, images).
            // However, handleEditWork just sets 'editingWork'. 
            // SpeciesModal uses 'initialData'. If initialData matches the form fields, it pre-fills.
            // If we only passed {id, descricao}, other fields would be empty in the form potentially?
            // Actually, SpeciesModal expects a full "Species" object for editing usually.
            // SOLUTION: When clicking "Fix", we should set the ID and let SpeciesModal (or a wrapper) fetch details? 
            // Currently SpeciesModal uses 'initialData' solely. It does NOT fetch by ID itself typically?
            // Checking SpeciesModal... lines 105 in SpeciesModal show `useEffect(() => { if (initialData) setFormData(...) })`.
            // It relies on `initialData`.
            // So, for Pending Items, we DO need to fetch their full data OR fetch it on demand.
            // Fetching ALL pending items full data might be heavy if there are many. 
            // Better: Store the light list for the Modal. When user clicks "Fix", fetch the single full species and THEN open edit modal.
            setPendingSpecies(pending);
        }

        setStats(prev => ({
            ...prev,
            seniorContributions: myCount || 0,
            species: globalCount || 0,
            seniorPending: pendingCount
        }));

        // 4. Recent Work - Fetch from both especie and familia tables
        const [recentSpecies, recentFamilies] = await Promise.all([
            supabase
                .from('especie')
                .select('id, nome_cientifico, created_at, local_id, familia_id, familia:familia_id(familia_nome), created_by, creator:profiles(full_name, email)')
                .is('local_id', null)
                .order('created_at', { ascending: false })
                .limit(10),
            supabase
                .from('familia')
                .select('id, familia_nome, created_at, created_by, creator:profiles(full_name, email)')
                .order('created_at', { ascending: false })
                .limit(10)
        ]);

        // Combine and tag each item with its type
        const speciesItems: RecentSpecies[] = (recentSpecies.data || []).map(item => ({
            ...item,
            type: 'especie' as const
        }));

        const familyItems: RecentFamily[] = (recentFamilies.data || []).map(item => ({
            ...item,
            type: 'familia' as const
        }));

        // Merge and sort by created_at descending
        const combined: RecentWorkItem[] = [...speciesItems, ...familyItems]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5); // Keep only top 5

        setRecentWork(combined);
    };

    const fetchLocalStats = async () => {
        if (!profile?.local_id) return;

        // Count species in project
        const { count: speciesCount } = await supabase
            .from('especie')
            .select('*', { count: 'exact', head: true })
            .eq('local_id', profile.local_id);

        // Count unique families in project (via species)
        const { data: projectSpecies } = await supabase
            .from('especie')
            .select('familia_id')
            .eq('local_id', profile.local_id)
            .not('familia_id', 'is', null);

        const uniqueFamiliesCount = new Set(projectSpecies?.map(s => s.familia_id)).size;

        setStats(prev => ({ ...prev, families: uniqueFamiliesCount || 0, species: speciesCount || 0 }));
    };

    const fetchPersonalStats = async () => {
        // Personal stats: created_by = user.id (UUID)

        const { count: mySpeciesCount } = await supabase
            .from('especie')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', profile?.id || '');

        // Fetch species to count unique families
        const { data: mySpecies } = await supabase
            .from('especie')
            .select('family_id')
            .eq('created_by', profile?.id || '');

        const uniqueFamilies = new Set(mySpecies?.map(s => s.family_id).filter(Boolean)).size;

        setStats(prev => ({ ...prev, species: mySpeciesCount || 0, families: uniqueFamilies }));
    };

    const getActionText = (action: string) => {
        switch (action) {
            case 'INSERT': return 'criou registro em';
            case 'UPDATE': return 'atualizou';
            case 'DELETE': return 'removeu de';
            default: return 'alterou';
        }
    };

    // Render Logic

    // Scenario A: Global Admin
    if (isGlobalAdmin) {
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
                    {/* Gestão Detalhada - Visível para GlobalAdmins, cards individuais restritos */}
                    <div className="w-full lg:w-[70%] bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[300px]">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-emerald-600" />
                            Gestão Detalhada
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Card Conteúdo do App - APENAS Curador Mestre */}
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

                            {/* Card Logs de Auditoria - APENAS Curador Mestre */}
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

                            {/* Placeholder para Coordenador Científico */}
                            {profile?.role === 'Coordenador Científico' && (
                                <div className="col-span-full flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                                    <Activity size={32} className="text-gray-300 mb-3" />
                                    <p className="text-gray-400 text-sm font-medium">Novas ferramentas de gestão em breve para Coordenadores.</p>
                                </div>
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

                {/* Access Denied Modal - com createPortal para garantir z-index máximo */}
                {showAccessDeniedModal && createPortal(
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                                    <Shield className="text-orange-500" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h3>
                                <p className="text-gray-600 mb-6">
                                    Esta área contém dados sensíveis de auditoria e é exclusiva para o perfil de <span className="font-medium text-gray-800">Curador Mestre</span>. Entre em contato com a administração se precisar de informações.
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
            </div >
        );
    }

    // Scenario B: Local Admin (Gestor)
    if (isLocalAdmin) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Visão Geral do Projeto</h1>
                    <p className="text-gray-500">Gestão de acervo local.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard title="Famílias do Projeto" value={stats.families} icon={TreeDeciduous} color="amber" loading={loading} />
                    <StatCard title="Espécies do Projeto" value={stats.species} icon={Leaf} color="emerald" loading={loading} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Famílias Recentes</h3>
                            <NavLink to="/families" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Ver todas</NavLink>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400 text-sm">
                            Lista simplificada de famílias...
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Espécies Recentes</h3>
                            <NavLink to="/species" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Ver todas</NavLink>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400 text-sm">
                            Lista simplificada de espécies...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Scenario C: Senior Taxonomist
    if (isSenior) {
        return (
            <div className="space-y-8 animate-fade-in-up">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Painel Científico</h1>
                    <p className="text-gray-500">Curadoria e gestão taxonômica global.</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Minhas Contribuições"
                        value={stats.seniorContributions || 0}
                        icon={Award}
                        color="emerald"
                        loading={loading}
                    />
                    <StatCard
                        title="Acervo Global"
                        value={stats.species}
                        icon={Globe}
                        color="blue"
                        loading={loading}
                    />
                    <StatCard
                        title={stats.seniorPending === 0 ? "Acervo Completo" : "Curadoria Necessária"}
                        value={stats.seniorPending === 0 ? "100%" : stats.seniorPending}
                        icon={stats.seniorPending === 0 ? CheckCircle : AlertTriangle}
                        color={stats.seniorPending === 0 ? "emerald" : "orange"}
                        loading={loading}
                        onClick={() => {
                            if (stats.seniorPending > 0) setIsPendingModalOpen(true);
                        }}
                    />    </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={handleNewSpecies}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-xl shadow-sm transition-all transform hover:scale-[1.01] flex flex-col items-center justify-center gap-3 group"
                    >
                        <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                            <Plus size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold">Nova Espécie</h3>
                            <p className="text-emerald-100 text-sm">Adicionar ao catálogo global</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setIsFamilyModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl shadow-sm transition-all transform hover:scale-[1.01] flex flex-col items-center justify-center gap-3 group"
                    >
                        <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                            <Plus size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold">Nova Família</h3>
                            <p className="text-blue-100 text-sm">Criar agrupamento taxonômico</p>
                        </div>
                    </button>
                </div>

                {/* Recent Work */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-gray-400" />
                        Trabalho Recente
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <th className="px-4 py-3">Família</th>
                                    <th className="px-4 py-3">Espécie</th>
                                    <th className="px-4 py-3">Atualização</th>
                                    <th className="px-4 py-3">Criado por</th>
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
                                            <td className="px-4 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                                            <td className="px-4 py-4"><div className="h-8 w-8 bg-gray-100 rounded ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : recentWork.length > 0 ? (
                                    recentWork.map((work) => (
                                        <tr key={`${work.type}-${work.id}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4 text-gray-600">
                                                {work.type === 'familia' ? (
                                                    <span className="font-medium text-gray-900">{work.familia_nome}</span>
                                                ) : (
                                                    (Array.isArray(work.familia) ? work.familia[0]?.familia_nome : work.familia?.familia_nome) || '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {work.type === 'especie' ? (
                                                    <span className="font-medium text-gray-900 italic">{work.nome_cientifico}</span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-400">
                                                {work.created_at ? formatDistanceToNow(new Date(work.created_at), { addSuffix: true, locale: ptBR }) : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-500">
                                                {(() => {
                                                    const creator = Array.isArray(work.creator) ? work.creator[0] : work.creator;
                                                    if (creator?.full_name) return creator.full_name;
                                                    if (creator?.email) return creator.email.split('@')[0];
                                                    return 'Sistema';
                                                })()}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button
                                                    onClick={() => handleEditWork(work)}
                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                                            Nenhum trabalho recente encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modals */}
                <PendingCuratorshipModal
                    isOpen={isPendingModalOpen}
                    onClose={() => setIsPendingModalOpen(false)}
                    items={pendingSpecies}
                    onFix={async (item) => {
                        // Fetch full data for the item before editing
                        const { data } = await supabase.from('especie').select('*, familia(familia_nome), imagens(url_imagem, local_id)').eq('id', item.id).single();
                        if (data) {
                            setEditingWork(data);
                            setIsPendingModalOpen(false); // Close list
                            setIsSpeciesModalOpen(true);  // Open edit
                        }
                    }}
                />
                <SpeciesModal
                    isOpen={isSpeciesModalOpen}
                    onClose={() => setIsSpeciesModalOpen(false)}
                    onSave={fetchSeniorStats} // Refresh stats/list on save
                    initialData={editingWork}
                />
                <FamilyModal
                    isOpen={isFamilyModalOpen}
                    onClose={() => { setIsFamilyModalOpen(false); setEditingFamily(null); }}
                    onSave={fetchSeniorStats}
                    initialData={editingFamily}
                />
            </div>
        );
    }

    // Default: Cataloger / Consulente / Fallback
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
        </div >
    );
}
