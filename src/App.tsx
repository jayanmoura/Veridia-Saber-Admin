import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { adminRouter, publicRouter } from './routes';

function App() {
  // Detect environment
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isLandingDomain = window.location.hostname === 'veridiasaber.com.br' ||
    window.location.hostname === 'www.veridiasaber.com.br' ||
    window.location.hostname === 'www.veridiasaber.com.br' ||
    window.location.hostname.includes('ngrok-free.app');

  // Hybrid logic for Dev:
  // - If on landing domain → show landing page
  // - If on localhost AND pathname is '/home' → show landing page (for testing)
  // - Otherwise → show admin panel
  const showLandingPage = isLandingDomain || (isLocalhost && window.location.pathname === '/home');

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
