import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import Disclaimer from '../pages/landingpage/Disclaimer';
import EmailConfirmed from '../pages/landingpage/EmailConfirmed';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { RequireRole } from '../components/RequireRole';

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

import { GLOBAL_MANAGEMENT_ROLES, SCIENTIFIC_CATALOG_ROLES, GLOBAL_MAP_ROLES, USER_MANAGEMENT_ROLES } from './roleConstants';
import { PrivateRoute } from './guards';

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
                element: <RequireRole allowedRoles={USER_MANAGEMENT_ROLES} redirectTo="/unauthorized" />,
                children: [
                    {
                        path: 'users',
                        element: <Users />,
                    },
                ],
            },
            {
                element: <RequireRole allowedRoles={GLOBAL_MANAGEMENT_ROLES} redirectTo="/unauthorized" />,
                children: [
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
