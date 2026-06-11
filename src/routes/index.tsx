import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { lazy } from 'react';
import Disclaimer from '../pages/landingpage/Disclaimer';
import EmailConfirmed from '../pages/landingpage/EmailConfirmed';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { RequireRole } from '../components/RequireRole';
import { useAuth } from '../contexts/AuthContext';

const Login = lazy(() => import('../pages/admin/Login'));
const Overview = lazy(() => import('../pages/admin/Overview'));
const Users = lazy(() => import('../pages/admin/Users'));
const Families = lazy(() => import('../pages/admin/Families'));
const Species = lazy(() => import('../pages/admin/Species'));
const Projects = lazy(() => import('../pages/admin/Projects'));
const Specimens = lazy(() => import('../pages/admin/Specimens'));
const SpecimensInspection = lazy(() => import('../pages/admin/SpecimensInspection'));
const ProjectDetails = lazy(() => import('../pages/admin/ProjectDetails'));
const EducationalContent = lazy(() => import('../pages/admin/EducationalContent'));
const AuditLogs = lazy(() => import('../pages/admin/AuditLogs'));
const ProjectMap = lazy(() => import('../pages/admin/ProjectMap'));
const GlobalMap = lazy(() => import('../pages/admin/GlobalMap'));
const ProjectMapViz = lazy(() => import('../components/Maps/ProjectMapViz').then(m => ({ default: m.ProjectMapViz })));
const Unauthorized = lazy(() => import('../pages/Unauthorized'));

// Global admin route permission matrix.
// Dashboard, project detail, and local/project-scoped routes remain under PrivateRoute only.
const GLOBAL_MANAGEMENT_ROLES = ['Curador Mestre', 'Coordenador Científico'];
const SCIENTIFIC_CATALOG_ROLES = ['Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior', 'Gestor de Acervo', 'Taxonomista de Campo'];
const GLOBAL_MAP_ROLES = ['Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior', 'Gestor de Acervo', 'Taxonomista de Campo'];

export function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { session, loading, profile } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-emerald-600 font-medium animate-pulse">Carregando...</div>;

    if (!session) return <Navigate to="/login" replace />;

    // Block 'Consulente' (read-only users)
    if (profile?.role === 'Consulente') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
                <h1 className="text-4xl font-bold text-gray-800">403</h1>
                <p className="text-gray-600">Acesso negado. Consulentes não têm acesso ao painel administrativo.</p>
                <button onClick={() => window.location.href = '/login'} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition">Voltar para Login</button>
            </div>
        )
    }

    return <>{children}</>;
}

export function OnlyGlobalAdmin({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth(); // Reuse hook

    if (loading) return null; // Or spinner

    if (profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico') {
        return <>{children}</>;
    }

    return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
            <p className="text-gray-600">Você não tem permissão para acessar logs de auditoria.</p>
            <Navigate to="/" replace />
        </div>
    );
}

export const adminRouter = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        // OAuth redirect route - /admin/login
        path: '/admin/login',
        element: <Login />,
    },
    {
        path: '/disclaimer',
        element: <Disclaimer />,
    },
    {
        path: '/email-confirmed',
        element: <EmailConfirmed />,
    },
    {
        // OAuth redirect route - /admin/dashboard redirects to main dashboard
        path: '/admin/dashboard',
        element: <Navigate to="/" replace />,
    },
    {
        path: '/',
        element: (
            <PrivateRoute>
                <DashboardLayout />
            </PrivateRoute>
        ),
        children: [
            {
                index: true,
                element: <Overview />,
            },
            {
                path: 'dashboard',
                element: <Navigate to="/" replace />,
            },
            {
                path: 'unauthorized',
                element: <Unauthorized />,
            },
            {
                path: 'projects/:id',
                element: <ProjectDetails />,
            },
            {
                path: 'project-map',
                element: <ProjectMap />,
            },
            {
                element: <RequireRole allowedRoles={GLOBAL_MANAGEMENT_ROLES} redirectTo="/unauthorized" />,
                children: [
                    {
                        path: 'users',
                        element: <Users />,
                    },
                    {
                        path: 'projects',
                        element: <Projects />,
                    },
                    {
                        path: 'conteudo-didatico',
                        element: <EducationalContent />,
                    },
                    {
                        path: 'seguranca/logs',
                        element: <AuditLogs />,
                    },
                    {
                        path: 'mapa-projetos',
                        element: <ProjectMapViz />,
                    },
                    {
                        path: 'specimens-inspection',
                        element: <SpecimensInspection />,
                    },
                ],
            },
            {
                element: <RequireRole allowedRoles={SCIENTIFIC_CATALOG_ROLES} redirectTo="/unauthorized" />,
                children: [
                    {
                        path: 'families',
                        element: <Families />,
                    },
                    {
                        path: 'species',
                        element: <Species />,
                    },
                    {
                        path: 'specimens',
                        element: <Specimens />,
                    },
                ],
            },
            {
                element: <RequireRole allowedRoles={GLOBAL_MAP_ROLES} redirectTo="/unauthorized" />,
                children: [
                    {
                        path: 'mapa-global',
                        element: <GlobalMap />,
                    },
                ],
            },
        ],
    },
    {
        path: '*',
        element: <Navigate to="/" replace />
    }
]);

