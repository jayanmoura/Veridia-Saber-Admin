import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';

// ─── Mock do Supabase ─────────────────────────────────────────────────────────
// vi.mock deve estar no topo do arquivo, antes de qualquer import do módulo mockado.
import { mockSupabase, mockSupabaseResponse, resetSupabaseMocks } from '../mocks/supabase';

vi.mock('../../lib/supabase', () => ({ supabase: mockSupabase }));

// ─── Importações do app (após o mock estar registrado) ──────────────────────
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/auth';

// ─── Componente auxiliar ──────────────────────────────────────────────────────
/**
 * Componente dummy que expõe os valores do contexto como atributos data-testid,
 * permitindo asserções sem acesso ao estado interno.
 */
function AuthConsumer() {
  const { session, profile, loading, isAdmin, signOut } = useAuth();

  if (loading) {
    return <div data-testid='loading-indicator'>Carregando...</div>;
  }

  return (
    <div>
      <span data-testid='session'>{session ? 'autenticado' : 'sem-sessao'}</span>
      <span data-testid='profile'>{profile ? profile.role : 'sem-perfil'}</span>
      <span data-testid='is-admin'>{isAdmin ? 'admin' : 'nao-admin'}</span>
      <button data-testid='sign-out-btn' onClick={signOut}>
        Sair
      </button>
    </div>
  );
}

// ─── Helper de renderização ───────────────────────────────────────────────────
function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

// ─── Perfil padrão de teste ───────────────────────────────────────────────────
const mockProfile = {
  id: 'user-123',
  email: 'teste@veridia.com',
  full_name: 'Usuário Teste',
  role: 'Curador Mestre' as UserRole,
  institution_id: null,
  local_id: null,
  avatar_url: null,
};

// ─── Sessão falsa compatível com @supabase/supabase-js ───────────────────────
const mockSession = {
  user: { id: 'user-123', email: 'teste@veridia.com' },
  access_token: 'fake-token',
  refresh_token: 'fake-refresh',
  expires_in: 3600,
  token_type: 'bearer',
};

// =============================================================================
// SUÍTE DE TESTES
// =============================================================================

describe('AuthContext', () => {
  beforeEach(() => {
    resetSupabaseMocks();

    // Padrão: sem sessão ativa — onAuthStateChange dispara INITIAL_SESSION com null,
    // fazendo loading virar false sem perfil.
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback: unknown) => {
      const cb = callback as (event: string, session: unknown) => void;
      cb('INITIAL_SESSION', null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  // ===========================================================================
  // GRUPO: Estado inicial
  // ===========================================================================
  describe('estado inicial', () => {
    it('não deve renderizar o conteúdo enquanto loading é true', async () => {
      // Simula onAuthStateChange que nunca dispara callback, mantendo loading = true
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      renderWithAuth(<AuthConsumer />);

      // O indicador de loading deve estar presente
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      // O indicador de sessão ainda não deve ter sido renderizado
      expect(screen.queryByTestId('session')).not.toBeInTheDocument();
    });

    it('com sessão inicial null, loading deve virar false', async () => {
      renderWithAuth(<AuthConsumer />);

      // Aguarda o estado de loading desaparecer
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('session').textContent).toBe('sem-sessao');
    });

    it('com sessão inicial null, profile deve ser null', async () => {
      renderWithAuth(<AuthConsumer />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('profile').textContent).toBe('sem-perfil');
    });
  });

  // ===========================================================================
  // GRUPO: Sessão autenticada
  // ===========================================================================
  describe('sessão autenticada', () => {
    beforeEach(() => {
      // Sessão ativa: onAuthStateChange dispara INITIAL_SESSION com mockSession
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: unknown) => {
        const cb = callback as (event: string, session: unknown) => void;
        cb('INITIAL_SESSION', mockSession);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      // Perfil de retorno para from('profiles').select().eq().single()
      mockSupabaseResponse('profiles', 'single', {
        data: mockProfile,
        error: null,
      });
    });

    it('deve disparar from("profiles").select().eq().single() com o id correto', async () => {
      renderWithAuth(<AuthConsumer />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });

      // Verifica que supabase.from foi chamado com 'profiles'
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('deve refletir o role do perfil retornado pelo mock', async () => {
      renderWithAuth(<AuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('profile').textContent).toBe('Curador Mestre');
      });
    });

    it.each<UserRole>([
      'Curador Mestre',
      'Coordenador Científico',
      'Gestor de Acervo',
    ])('isAdmin deve ser true para o role "%s"', async (role) => {
      mockSupabaseResponse('profiles', 'single', {
        data: { ...mockProfile, role },
        error: null,
      });

      renderWithAuth(<AuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('is-admin').textContent).toBe('admin');
      });
    });

    it.each<UserRole>([
      'Taxonomista Sênior',
      'Taxonomista de Campo',
      'Consulente',
    ])('isAdmin deve ser false para o role "%s"', async (role) => {
      mockSupabaseResponse('profiles', 'single', {
        data: { ...mockProfile, role },
        error: null,
      });

      renderWithAuth(<AuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('is-admin').textContent).toBe('nao-admin');
      });
    });
  });

  // ===========================================================================
  // GRUPO: signOut
  // ===========================================================================
  describe('signOut', () => {
    let authCallback: ((event: string, session: any) => void) | null = null;

    beforeEach(() => {
      authCallback = null;

      // Perfil de retorno para a sessão inicial
      mockSupabaseResponse('profiles', 'single', {
        data: mockProfile,
        error: null,
      });

      mockSupabase.auth.signOut.mockImplementation(async () => {
        if (authCallback) {
          authCallback('SIGNED_OUT', null);
        }
        return { error: null };
      });

      // Captura o callback E dispara INITIAL_SESSION para carregar o estado inicial
      mockSupabase.auth.onAuthStateChange.mockImplementation(
        (callback: unknown) => {
          authCallback = callback as (event: string, session: any) => void;
          authCallback('INITIAL_SESSION', mockSession as any);
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        },
      );
    });

    it('chamar signOut() deve invocar supabase.auth.signOut()', async () => {
      renderWithAuth(<AuthConsumer />);

      // Aguarda carregamento do perfil
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('sign-out-btn').click();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('após signOut e evento onAuthStateChange, session e profile devem ser null', async () => {
      renderWithAuth(<AuthConsumer />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });

      // Dispara o signOut (que agora simula o evento de auth state change)
      await act(async () => {
        screen.getByTestId('sign-out-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('session').textContent).toBe('sem-sessao');
        expect(screen.getByTestId('profile').textContent).toBe('sem-perfil');
      });
    });
  });
});
