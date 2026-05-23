import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { adminRouter } from './routes';
import { lazy } from 'react';

import LandingPage from './pages/landingpage/LandingPage';
import Privacy from './pages/landingpage/Privacy';
import Terms from './pages/landingpage/Terms';
import Disclaimer from './pages/landingpage/Disclaimer';
import EmailConfirmed from './pages/landingpage/EmailConfirmed';

const CatalogoEspecies = lazy(() => import('./pages/landingpage/CatalogoEspecies'));
const DetalhesEspecie = lazy(() => import('./pages/landingpage/DetalhesEspecie'));
const CatalogoFamilias = lazy(() => import('./pages/landingpage/CatalogoFamilias'));
const DetalhesFamilia = lazy(() => import('./pages/landingpage/DetalhesFamilia'));
const LocalsPublicos = lazy(() => import('./pages/landingpage/LocalsPublicos'));
const DetalhesLocal = lazy(() => import('./pages/landingpage/DetalhesLocal'));
const DetalhesEspecimeLocal = lazy(() => import('./pages/landingpage/DetalhesEspecimeLocal'));
const MorfologiaPage = lazy(() => import('./pages/landingpage/MorfologiaPage'));
const MorfologiaOrgaoPage = lazy(() => import('./pages/landingpage/MorfologiaOrgaoPage'));
const SobrePage = lazy(() => import('./pages/landingpage/SobrePage'));
const CriadorPage = lazy(() => import('./pages/landingpage/CriadorPage'));

const publicRouter = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/catalogo',
    element: <CatalogoEspecies />,
  },
  {
    path: '/catalogo/especie/:id',
    element: <DetalhesEspecie />,
  },
  {
    path: '/familias-catalogo',
    element: <CatalogoFamilias />,
  },
  {
    path: '/familias-catalogo/:id',
    element: <DetalhesFamilia />,
  },
  {
    path: '/familias',
    element: <CatalogoFamilias />,
  },
  {
    path: '/familias/:id',
    element: <DetalhesFamilia />,
  },
  {
    path: '/locais-publico',
    element: <LocalsPublicos />,
  },
  {
    path: '/locais-publico/:id',
    element: <DetalhesLocal />,
  },
  {
    path: '/locais-publico/:localId/especime/:especimeId',
    element: <DetalhesEspecimeLocal />,
  },
  {
    path: '/morfologia',
    element: <MorfologiaPage />,
  },
  {
    path: '/morfologia/:orgao',
    element: <MorfologiaOrgaoPage />,
  },
  {
    path: '/sobre',
    element: <SobrePage />,
  },
  {
    path: '/criador',
    element: <CriadorPage />,
  },
  {
    path: '/privacidade',
    element: <Privacy />,
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
    path: '/isencao',
    element: <Disclaimer />,
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

function App() {
  // Detect environment
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isLandingDomain = window.location.hostname === 'veridiasaber.com.br' ||
    window.location.hostname === 'www.veridiasaber.com.br' ||
    window.location.hostname === 'www.veridiasaber.com.br' ||
    window.location.hostname.includes('ngrok-free.app');

  // Check if accessing admin routes (for OAuth redirect handling)
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  // Check if this is an OAuth callback (token in hash fragment)
  const isOAuthCallback = window.location.hash.includes('access_token=');

  // Hybrid logic:
  // - If OAuth callback → show admin panel (handle authentication)
  // - If on landing domain AND NOT accessing /admin/* → show landing page
  // - If on localhost AND pathname matches a public route → show landing page (for testing)
  // - Otherwise → show admin panel
  const isPublicPath = 
    window.location.pathname === '/' ||
    window.location.pathname === '/home' || 
    window.location.pathname.startsWith('/catalogo') || 
    window.location.pathname.startsWith('/familias') || 
    window.location.pathname.startsWith('/familias-catalogo') || 
    window.location.pathname.startsWith('/locais-publico') || 
    window.location.pathname.startsWith('/morfologia') || 
    window.location.pathname === '/sobre' || 
    window.location.pathname === '/criador' || 
    window.location.pathname === '/privacidade' || 
    window.location.pathname === '/politica' || 
    window.location.pathname === '/termos' || 
    window.location.pathname === '/isencao' || 
    window.location.pathname === '/disclaimer' ||
    window.location.pathname === '/email-confirmed';

  const showLandingPage = !isOAuthCallback && ((isLandingDomain && !isAdminRoute) || (isLocalhost && isPublicPath));

  if (showLandingPage) {
    return <RouterProvider router={publicRouter} />;
  }

  // Admin mode (default for localhost)
  return (
    <AuthProvider>
      <RouterProvider router={adminRouter} />
    </AuthProvider>
  );
}

export default App;

