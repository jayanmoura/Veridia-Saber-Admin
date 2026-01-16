import { Users, Mail, Shield } from 'lucide-react';
import { ROLES_CONFIG, type UserRole } from '../../types/auth';

export interface LinkedUser {
    id: string;
    full_name: string | null;
    email: string;
    role: string | null;
    avatar_url: string | null;
}

interface UsersTabProps {
    users: LinkedUser[];
}

// Badge styling using ROLES_CONFIG
const getRoleBadgeStyle = (role: string | null): React.CSSProperties => {
    if (!role) return { backgroundColor: '#F5F5F5', color: '#616161' };
    const config = ROLES_CONFIG[role as UserRole];
    return {
        backgroundColor: config?.bgColor ?? '#F5F5F5',
        color: config?.color ?? '#616161',
    };
};

/**
 * Users tab content for ProjectDetails page.
 */
export function UsersTab({ users }: UsersTabProps) {
    if (users.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p>Nenhum usuário vinculado a este projeto.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {users.map((user) => (
                <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                            {user.full_name || 'Sem nome'}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                            <Mail size={12} />
                            {user.email}
                        </p>
                    </div>
                    <span
                        className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                        style={getRoleBadgeStyle(user.role)}
                    >
                        <Shield size={12} />
                        {user.role || 'Sem cargo'}
                    </span>
                </div>
            ))}
        </div>
    );
}
