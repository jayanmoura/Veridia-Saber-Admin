import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { ADMIN_PANEL_ROLES } from './roleConstants';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { session, loading, profile } = auth;

  if (loading) {
    return (
      <div className='h-screen flex items-center justify-center bg-gray-50 text-emerald-600 font-medium animate-pulse'>
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Navigate to='/login' replace />;
  }

  if (!profile) {
    return (
      <div className='h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4'>
        <h1 className='text-2xl font-bold text-gray-800'>Não foi possível carregar seu perfil</h1>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className='px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition'
          >
            Tentar novamente
          </button>
          <button
            onClick={async () => {
              await auth.signOut?.();
              window.location.href = '/login';
            }}
            className='px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition'
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  // Block 'Consulente' (read-only users)
  if (profile.role === 'Consulente') {
    return (
      <div className='h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4'>
        <h1 className='text-4xl font-bold text-gray-800'>403</h1>
        <p className='text-gray-600'>Acesso negado. Consulentes não têm acesso ao painel administrativo.</p>
        <button
          onClick={async () => {
            await auth.signOut?.();
            window.location.href = '/login';
          }}
          className='px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition'
        >
          Voltar para Login
        </button>
      </div>
    );
  }

  if (!(ADMIN_PANEL_ROLES as readonly string[]).includes(profile.role)) {
    return (
      <div className='h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4'>
        <h1 className='text-4xl font-bold text-gray-800'>403</h1>
        <p className='text-gray-600'>Acesso negado. Seu perfil não tem acesso ao painel administrativo.</p>
        <button
          onClick={async () => {
            await auth.signOut?.();
            window.location.href = '/login';
          }}
          className='px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition'
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
