import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { StatCard } from '../components/Dashboard/StatCard';
import { Leaf, TreeDeciduous, MapPin, Activity } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Overview() {
    const { profile } = useAuth();

    const [stats, setStats] = useState({
        families: 0,
        species: 0,
        projects: 0,
        users: 0,
    });

    const [loading, setLoading] = useState(true);

    // Derived check for simplified logic
    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';
    const isLocalAdmin = profile?.role === 'Gestor de Acervo';
    // 'Taxonomista' usually falls into default or check includes
    const isCataloger = profile?.role?.includes('Taxonomista') || profile?.role === 'Consulente';

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
        const [families, species, projects, users] = await Promise.all([
            supabase.from('familia').select('*', { count: 'exact', head: true }),
            supabase.from('especie').select('*', { count: 'exact', head: true }),
            supabase.from('locais').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
        ]);

        setStats({
            families: families.count || 0,
            species: species.count || 0,
            projects: projects.count || 0,
            users: users.count || 0,
        });
    };

    const fetchLocalStats = async () => {
        if (!profile?.local_id) return;

        // Filtering by local_id (Foreign Key)
        const [families, species] = await Promise.all([
            supabase.from('familia').select('*', { count: 'exact', head: true }).eq('local_id', profile.local_id),
            supabase.from('especie').select('*', { count: 'exact', head: true }).eq('local_id', profile.local_id),
        ]);

        setStats(prev => ({ ...prev, families: families.count || 0, species: species.count || 0 }));
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
                    <StatCard title="Projetos Cadastrados" value={stats.projects} icon={MapPin} color="purple" loading={loading} />
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-[70%] bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[300px]">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-emerald-600" />
                            Gestão Detalhada
                        </h3>
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            Gráficos ou tabelas detalhadas serão exibidos aqui.
                        </div>
                    </div>
                    <div className="w-full lg:w-[30%] bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[300px]">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Atividades Recentes</h3>
                        <ul className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <li key={i} className="flex gap-3 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                                    <span className="text-gray-600">Usuário <strong className="text-gray-800">João</strong> cadastrou nova espécie.</span>
                                </li>
                            ))}
                            <li className="text-xs text-center pt-4 text-emerald-600 hover:underline cursor-pointer">Ver todas</li>
                        </ul>
                    </div>
                </div>
            </div>
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

    // Scenario C: Cataloger
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
