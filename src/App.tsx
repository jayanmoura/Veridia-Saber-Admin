import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { adminRouter, publicRouter } from './routes';

function App() {
  // Check if current domain is the main landing page domain
  const isLandingPage = window.location.hostname === 'veridiasaber.com.br' ||
    window.location.hostname === 'www.veridiasaber.com.br';

  if (isLandingPage) {
    return <RouterProvider router={publicRouter} />;
  }

  return (
    <AuthProvider>
      <RouterProvider router={adminRouter} />
    </AuthProvider>
  );
}

export default App;
