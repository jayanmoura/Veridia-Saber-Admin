import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import type { UserRole } from '../types/auth';

interface RequireRoleProps {
    allowedRoles: readonly UserRole[];
    redirectTo?: string;
    requireLocalId?: boolean;
}

export function RequireRole({ allowedRoles, redirectTo = '/dashboard', requireLocalId = false }: RequireRoleProps) {
    const { session, profile, loading } = useAuth();

    if (loading) return null;

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    if (!profile?.role || !allowedRoles.includes(profile.role)) {
        return <Navigate to={redirectTo} replace />;
    }

    if (requireLocalId && !profile?.local_id) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
