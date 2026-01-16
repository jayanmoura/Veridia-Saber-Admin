import { LayoutDashboard, Users, Leaf, TreeDeciduous, MapPin, LogOut, MapPinned, Globe } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasMinLevel, ROLES_CONFIG } from '../../types/auth';
import logoIcon from '../../assets/icon.png';
import { InstallPWA } from '../InstallPWA';

// TAREFA 2: Restrição de Páginas por Nível
// Níveis: 1=Curador, 2=Coordenador, 3=TaxSênior, 4=Gestor, 5=TaxCampo, 6=Consulente
const MENU_ITEMS = [
    {
        label: 'Visão Geral',
        path: '/',
        icon: LayoutDashboard,
        minLevel: 5, // Curador(1), Coord(2), TaxSênior(3), Gestor(4), TaxCampo(5)
    },
    {
        label: 'Famílias',
        path: '/families',
        icon: TreeDeciduous,
        minLevel: 3, // Curador(1), Coord(2), TaxSênior(3)
    },
    {
        label: 'Espécies',
        path: '/species',
        icon: Leaf,
        minLevel: 5, // Curador(1), Coord(2), TaxSênior(3), Gestor(4), TaxCampo(5)
    },
    {
        label: 'Projetos',
        path: '/projects',
        icon: MapPin,
        minLevel: 2, // Curador(1), Coord(2)
    },
    {
        label: 'Mapa do Projeto',
        path: '/project-map',
        icon: MapPinned,
        minLevel: 5,
        requiresLocalId: true, // Apenas para usuários com local_id
    },
    {
        label: 'Mapa Global',
        path: '/mapa-global',
        icon: Globe,
        exactLevel: 3, // Apenas TaxSênior(3) - Curador e Coord já têm no Overview
    },
    {
        label: 'Usuários',
        path: '/users',
        icon: Users,
        minLevel: 4, // Curador(1), Coord(2), Gestor(4)
    },
];

export function Sidebar() {
    const { signOut, profile } = useAuth();

    // Filtrar itens por nível mínimo/exato e requisito de local_id
    const filteredItems = MENU_ITEMS.filter(item => {
        // Se tem exactLevel, verifica se é exatamente esse nível
        if (item.exactLevel) {
            const roleLevel = ROLES_CONFIG[profile?.role as keyof typeof ROLES_CONFIG]?.level;
            if (roleLevel !== item.exactLevel) return false;
        } else if (item.minLevel) {
            // Caso contrário, usa minLevel
            if (!hasMinLevel(profile?.role, item.minLevel)) return false;
        }
        if (item.requiresLocalId && !profile?.local_id) return false;
        return true;
    });

    return (
        <aside className="w-64 bg-teal-950 text-white flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 shadow-xl">
            {/* Header with Logo */}
            <div className="h-20 flex items-center px-6 border-b border-teal-800/50 bg-teal-950">
                <img src={logoIcon} alt="Logo Veridia" className="w-10 h-10 mr-3 rounded-lg" />
                <h1 className="text-xl font-bold text-white">
                    Veridia Saber
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1">
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-teal-400/70">
                    Navegação
                </div>
                {filteredItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-teal-800 text-white border border-teal-600/30 shadow-sm'
                                : 'text-gray-200 hover:bg-teal-900 hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer - PWA Install & Sign Out */}
            <div className="p-4 border-t border-teal-800/50 bg-teal-950 space-y-2">
                {/* PWA Install Button */}
                <div className="flex justify-center">
                    <InstallPWA />
                </div>
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-teal-900/50 rounded-lg transition-colors"
                >
                    <LogOut size={18} />
                    <span>Sair do Sistema</span>
                </button>
            </div>
        </aside>
    );
}
