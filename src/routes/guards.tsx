import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 text-emerald-600 font-medium animate-pulse">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Block 'Consulente' (read-only users)
  if (profile?.role === 'Consulente') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">403</h1>
        <p className="text-gray-600">Acesso negado. Consulentes não têm acesso ao painel administrativo.</p>
        <button
          onClick={() => { window.location.href = '/login'; }}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          Voltar para Login
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export function OnlyGlobalAdmin({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) return null;

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
