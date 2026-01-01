import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Overview from '../pages/Overview';
import Users from '../pages/Users';
import Families from '../pages/Families';
import Species from '../pages/Species';
import Projects from '../pages/Projects';
import ProjectDetails from '../pages/ProjectDetails';
import EducationalContent from '../pages/EducationalContent';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { session, loading, profile } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-emerald-600 font-medium animate-pulse">Carregando...</div>;

    if (!session) return <Navigate to="/login" replace />;

    // Block 'Consulente' (read-only users)
    if (profile?.role === 'Consulente') {
        // You might want a dedicated 403 page, but for now redirect or show simple deny
        // Using a simple deny approach:
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

import AuditLogs from '../pages/AuditLogs';

// ... (PrivateRoute remains same)

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

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
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
        ],
    },
]);

