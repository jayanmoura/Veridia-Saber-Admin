import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import React from 'react';

// ============================================================================
// MOCKS
// ============================================================================

// Faremos o mock global do hook useAuth antes de importar os componentes
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../contexts/AuthContext';
import { PrivateRoute, OnlyGlobalAdmin } from '../../routes/index';
import type { UserRole } from '../../types/auth';

// Componente simples para detectar redirecionamentos nos testes
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
}

// Helper para renderizar um componente envolto em MemoryRouter
function renderWithRouter(ui: React.ReactElement, initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        {/* Rota principal (onde o componente sob teste é renderizado) */}
        <Route path="/" element={ui} />
        {/* Rota de destino comum de redirecionamento (Login) */}
        <Route path="/login" element={<LocationDisplay />} />
        {/* Usamos catch-all apenas para pegar as outras URLs de replace */}
        <Route path="*" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );
}

// ============================================================================
// SUÍTE DE TESTES
// ============================================================================

describe('Route Guards', () => {
  const mockUseAuth = useAuth as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const DummyChild = () => <div data-testid="conteudo-protegido">acesso liberado</div>;

  // --------------------------------------------------------------------------
  // GRUPO: PrivateRoute — sem sessão
  // --------------------------------------------------------------------------
  describe('PrivateRoute — sem sessão', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        session: null,
        loading: false,
        profile: null,
      });
    });

    it('não deve renderizar o children', () => {
      renderWithRouter(
        <PrivateRoute>
          <DummyChild />
        </PrivateRoute>
      );
      expect(screen.queryByTestId('conteudo-protegido')).not.toBeInTheDocument();
    });

    it('deve redirecionar para /login', () => {
      renderWithRouter(
        <PrivateRoute>
          <DummyChild />
        </PrivateRoute>
      );
      // O componente LocationDisplay renderizado pela rota /login exibirá o pathname
      expect(screen.getByTestId('location-display').textContent).toBe('/login');
    });
  });

  // --------------------------------------------------------------------------
  // GRUPO: PrivateRoute — loading
  // --------------------------------------------------------------------------
  describe('PrivateRoute — loading', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        session: null,
        loading: true,
        profile: null,
      });
    });

    it('deve renderizar o spinner de carregamento', () => {
      renderWithRouter(
        <PrivateRoute>
          <DummyChild />
        </PrivateRoute>
      );
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('não deve renderizar o children ainda', () => {
      renderWithRouter(
        <PrivateRoute>
          <DummyChild />
        </PrivateRoute>
      );
      expect(screen.queryByTestId('conteudo-protegido')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // GRUPO: PrivateRoute — Consulente bloqueado
  // --------------------------------------------------------------------------
  describe('PrivateRoute — Consulente bloqueado', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        session: { user: { id: '123' } },
        loading: false,
        profile: { role: 'Consulente' as UserRole },
      });
    });

    it('deve renderizar o bloco 403', () => {
      renderWithRouter(
        <PrivateRoute>
          <DummyChild />
        </PrivateRoute>
      );
      expect(screen.getByText('403')).toBeInTheDocument();
    });

    it('deve exibir o texto "Acesso negado"', () => {
      renderWithRouter(
        <PrivateRoute>
          <DummyChild />
        </PrivateRoute>
      );
      expect(
        screen.getByText(/Acesso negado\. Consulentes não têm acesso ao painel/i)
      ).toBeInTheDocument();
    });

    it('não deve renderizar o children', () => {
      renderWithRouter(
        <PrivateRoute>
          <DummyChild />
        </PrivateRoute>
      );
      expect(screen.queryByTestId('conteudo-protegido')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // GRUPO: PrivateRoute — acesso liberado
  // --------------------------------------------------------------------------
  describe('PrivateRoute — acesso liberado', () => {
    it.each<UserRole>([
      'Curador Mestre',
      'Gestor de Acervo',
      'Taxonomista de Campo',
    ])('com sessão válida e role "%s" deve renderizar o children normalmente', (role) => {
      mockUseAuth.mockReturnValue({
        session: { user: { id: '123' } },
        loading: false,
        profile: { role },
      });

      renderWithRouter(
        <PrivateRoute>
          <DummyChild />
        </PrivateRoute>
      );

      expect(screen.getByTestId('conteudo-protegido')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // GRUPO: OnlyGlobalAdmin
  // --------------------------------------------------------------------------
  describe('OnlyGlobalAdmin', () => {
    describe('Acesso permitido', () => {
      it.each<UserRole>(['Curador Mestre', 'Coordenador Científico'])(
        'com role "%s" deve renderizar o children',
        (role) => {
          mockUseAuth.mockReturnValue({
            session: { user: { id: '123' } },
            loading: false,
            profile: { role },
          });

          renderWithRouter(
            <OnlyGlobalAdmin>
              <DummyChild />
            </OnlyGlobalAdmin>
          );

          expect(screen.getByTestId('conteudo-protegido')).toBeInTheDocument();
        }
      );
    });

    describe('Acesso negado (redirecionamento silencioso)', () => {
      it.each<UserRole>([
        'Gestor de Acervo',
        'Taxonomista Sênior',
        'Taxonomista de Campo',
        'Consulente',
      ])('com role "%s" não deve renderizar o children e deve redirecionar', (role) => {
        mockUseAuth.mockReturnValue({
          session: { user: { id: '123' } },
          loading: false,
          profile: { role },
        });

        render(
          <MemoryRouter initialEntries={['/rota-secreta']}>
            <Routes>
              <Route path="/rota-secreta" element={
                <OnlyGlobalAdmin>
                  <DummyChild />
                </OnlyGlobalAdmin>
              } />
              <Route path="/" element={<LocationDisplay />} />
            </Routes>
          </MemoryRouter>
        );

        expect(screen.queryByTestId('conteudo-protegido')).not.toBeInTheDocument();
        // O Navigate redireciona instantaneamente para `/`, e o location muda
        expect(screen.getByTestId('location-display').textContent).toBe('/');
      });
    });
  });
});
