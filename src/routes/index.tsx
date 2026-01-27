import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/admin/Login';
import Overview from '../pages/admin/Overview';
import Users from '../pages/admin/Users';
import Families from '../pages/admin/Families';
import Species from '../pages/admin/Species';
import Projects from '../pages/admin/Projects';
import Specimens from '../pages/admin/Specimens';
import ProjectDetails from '../pages/admin/ProjectDetails';
import EducationalContent from '../pages/admin/EducationalContent';
import AuditLogs from '../pages/admin/AuditLogs';
import ProjectMap from '../pages/admin/ProjectMap';
import GlobalMap from '../pages/admin/GlobalMap';
import { ProjectMapViz } from '../components/Maps/ProjectMapViz';
import LandingPage from '../pages/landingpage/LandingPage';
import Privacy from '../pages/landingpage/Privacy';
import Terms from '../pages/landingpage/Terms';
import Disclaimer from '../pages/landingpage/Disclaimer';
import EmailConfirmed from '../pages/landingpage/EmailConfirmed';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';

function PrivateRoute({ children }: { children: React.ReactNode }) {
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

function OnlyGlobalAdmin({ children }: { children: React.ReactNode }) {
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

export const publicRouter = createBrowserRouter([
    {
        path: '/',
        element: <LandingPage />,
    },
    {
        path: '/politica',
        element: <Privacy />,
    },
    {
        path: '/termos',
        element: <Terms />,
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
        path: '*',
        element: <Navigate to="/" replace />
    }
]);

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
                path: 'users',
                element: <Users />,
            },
            {
                path: 'families',
                element: <Families />,
            },
            {
                path: 'species',
                element: <Species />,
            },
            {
                path: 'projects',
                element: <Projects />,
            },
            {
                path: 'projects/:id',
                element: <ProjectDetails />,
            },
            {
                path: 'specimens',
                element: <Specimens />,
            },
            {
                path: 'conteudo-didatico',
                element: <EducationalContent />,
            },
            {
                path: 'seguranca/logs',
                element: (
                    <OnlyGlobalAdmin>
                        <AuditLogs />
                    </OnlyGlobalAdmin>
                ),
            },
            {
                path: 'mapa-global',
                element: <GlobalMap />,
            },
            {
                path: 'mapa-projetos',
                element: (
                    <OnlyGlobalAdmin>
                        <ProjectMapViz />
                    </OnlyGlobalAdmin>
                ),
            },
            {
                path: 'project-map',
                element: <ProjectMap />,
            },
        ],
    },
    {
        path: '*',
        element: <Navigate to="/" replace />
    }
]);

