import { LayoutDashboard, Users, Leaf, TreeDeciduous, MapPin, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/auth';
import logoIcon from '../../assets/icon.png';

// Helper to determine active role permissions
const hasAccess = (allowedRoles: string[], userRole?: UserRole) => {
    if (!userRole) return false;
    // Direct string match now that strict types are used
    return allowedRoles.includes(userRole);
};

export function Sidebar() {
    const { signOut, profile } = useAuth();

    const MENU_ITEMS = [
        {
            label: 'Visão Geral',
            path: '/',
            icon: LayoutDashboard,
            allowedRoles: ['Curador Mestre', 'Coordenador Científico', 'Gestor de Acervo', 'Taxonomista Sênior', 'Taxonomista de Campo']
        },
        {
            label: 'Famílias',
            path: '/families',
            icon: TreeDeciduous,
            allowedRoles: ['Curador Mestre', 'Coordenador Científico']
        },
        {
            label: 'Espécies',
            path: '/species',
            icon: Leaf,
            allowedRoles: ['Curador Mestre', 'Coordenador Científico', 'Gestor de Acervo', 'Taxonomista Sênior', 'Taxonomista de Campo']
        },
        {
            label: 'Projetos',
            path: '/projects',
            icon: MapPin,
            allowedRoles: ['Curador Mestre', 'Coordenador Científico']
        },
        {
            label: 'Usuários',
            path: '/users',
            icon: Users,
            allowedRoles: ['Curador Mestre', 'Coordenador Científico', 'Gestor de Acervo']
        },
    ];

    const filteredItems = MENU_ITEMS.filter(item =>
        hasAccess(item.allowedRoles, profile?.role)
    );

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

            {/* Footer - Sign Out */}
            <div className="p-4 border-t border-teal-800/50 bg-teal-950">
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
