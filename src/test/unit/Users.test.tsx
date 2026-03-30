import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, within } from '@testing-library/react';


// Mocks GLOBAIS
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useParams: () => ({}),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock do supabase (usando nosso setup de src/test/mocks/supabase)
vi.mock('../../lib/supabase');
import { mockSupabaseResponse } from '../mocks/supabase';

import Users, { isGlobalRole } from '../../pages/admin/Users';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/auth';

describe('Users Page RBAC', () => {
  const mockUseAuth = useAuth as Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: Listas vazias no fetchProfiles e fetchProjects para evitar warnings ou renders longos
    mockSupabaseResponse('profiles', 'select', { data: [], error: null });
    mockSupabaseResponse('locais', 'select', { data: [], error: null });
  });

  // --------------------------------------------------------------------------
  // GRUPO: Acesso à página por role
  // --------------------------------------------------------------------------
  describe('acesso à página por role', () => {
    it.each<UserRole>([
      'Curador Mestre',
      'Coordenador Científico',
      'Gestor de Acervo',
    ])('%s — deve renderizar a página', (role) => {
      mockUseAuth.mockReturnValue({
        profile: { id: '123', role, local_id: 'loc-1' },
      });

      render(<Users />);
      expect(screen.getByText('Gerenciar Membros')).toBeInTheDocument();
      // Não deve mostrar "Acesso Negado"
      expect(screen.queryByText('Acesso Negado')).not.toBeInTheDocument();
    });

    it.each<UserRole>([
      'Taxonomista Sênior',
      'Taxonomista de Campo',
      'Consulente',
    ])('%s — não deve renderizar a tabela (sem acesso)', (role) => {
      mockUseAuth.mockReturnValue({
        profile: { id: '123', role, local_id: 'loc-1' },
      });

      render(<Users />);
      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      expect(screen.queryByText('Gerenciar Membros')).not.toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // GRUPO: canManageUser — regras de hierarquia
  // --------------------------------------------------------------------------
  describe('canManageUser — regras de hierarquia', () => {
    // Helper: renderiza a página de Users injetando alguns profiles mockados
    const renderWithSimulatedProfiles = (
      myRole: UserRole,
      myId: string = 'me',
      targetProfiles: { id: string; role: UserRole; full_name: string }[]
    ) => {
      mockUseAuth.mockReturnValue({
        profile: { id: myId, role: myRole, local_id: 'loc-1' },
      });

      mockSupabaseResponse('profiles', 'select', {
        data: targetProfiles.map((p) => ({
          ...p,
          email: `${p.id}@test.com`,
          avatar_url: null,
          local_id: 'loc-1',
        })),
        error: null,
      });

      render(<Users />);
    };

    it('Curador Mestre pode gerenciar Coordenador Científico (botão de editar visível)', async () => {
      renderWithSimulatedProfiles('Curador Mestre', 'me', [
        { id: 'target', role: 'Coordenador Científico', full_name: 'Alvo Coordenador' },
      ]);

      // A tabela é renderizada de forma assíncrona baseada no state do Supabase Mock, 
      // mas como mockSupabaseResponse é síncrono para os data promises e useEffect atira de imediato, findBy garantirá
      const row = await screen.findByText('Alvo Coordenador');
      const tr = row.closest('tr');
      
      // O botão "Editar Cargo" deve estar visível
      expect(within(tr!).getByTitle('Editar Cargo')).toBeInTheDocument();
    });

    it('Curador Mestre pode gerenciar Consulente', async () => {
      renderWithSimulatedProfiles('Curador Mestre', 'me', [
        { id: 'target', role: 'Consulente', full_name: 'Alvo Consulente' },
      ]);

      const row = await screen.findByText('Alvo Consulente');
      const tr = row.closest('tr');
      expect(within(tr!).getByTitle('Editar Cargo')).toBeInTheDocument();
    });

    it('Gestor de Acervo pode gerenciar Taxonomista de Campo', async () => {
      renderWithSimulatedProfiles('Gestor de Acervo', 'me', [
        { id: 'target', role: 'Taxonomista de Campo', full_name: 'Alvo Taxonomista' },
      ]);

      const row = await screen.findByText('Alvo Taxonomista');
      const tr = row.closest('tr');
      expect(within(tr!).getByTitle('Editar Cargo')).toBeInTheDocument();
    });

    it('Gestor de Acervo não pode gerenciar Taxonomista Sênior (botão de editar oculto ou desabilitado)', async () => {
      renderWithSimulatedProfiles('Gestor de Acervo', 'me', [
        { id: 'target', role: 'Taxonomista Sênior', full_name: 'Alvo Sênior' },
      ]);

      const row = await screen.findByText('Alvo Sênior');
      const tr = row.closest('tr');
      
      // Quando não tem permissão, aparece um ícone de "Lock" com title "Sem permissão" no lugar dos botões
      expect(within(tr!).queryByTitle('Editar Cargo')).not.toBeInTheDocument();
      expect(within(tr!).getByTitle('Sem permissão')).toBeInTheDocument();
    });

    it('Nenhum usuário pode gerenciar a si mesmo', async () => {
      renderWithSimulatedProfiles('Curador Mestre', 'me', [
        { id: 'me', role: 'Curador Mestre', full_name: 'Eu Mesmo' },
      ]);

      const row = await screen.findByText('Eu Mesmo');
      const tr = row.closest('tr');
      
      expect(within(tr!).queryByTitle('Editar Cargo')).not.toBeInTheDocument();
      expect(within(tr!).getByTitle('Sem permissão')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // GRUPO: isRoleDisabled — dropdown de atribuição de cargo
  // --------------------------------------------------------------------------
  describe('isRoleDisabled — dropdown de atribuição de cargo', () => {
    const renderEditModal = async (myRole: UserRole, targetRole: UserRole = 'Consulente') => {
      mockUseAuth.mockReturnValue({
        profile: { id: 'me', role: myRole, local_id: 'loc-1' },
      });

      mockSupabaseResponse('profiles', 'select', {
        data: [
          {
            id: 'target',
            role: targetRole,
            full_name: 'Usuário Alvo',
            email: 'target@test.com',
            local_id: 'loc-1',
          },
        ],
        error: null,
      });

      render(<Users />);
      const editBtn = await screen.findByTitle('Editar Cargo');
      editBtn.click(); // Abre o modal
    };

    it('Gestor de Acervo (nível 4) vê desabilitados: Curador Mestre, Coordenador Científico, Taxonomista Sênior, Gestor de Acervo', async () => {
      await renderEditModal('Gestor de Acervo');

      // Modal aberto, buscar select de cargos
      const select = screen.getByLabelText('Cargo'); // Usa o label exato
      
      const disabledRoles = [
        'Curador Mestre',
        'Coordenador Científico',
        'Taxonomista Sênior',
        'Gestor de Acervo',
      ];

      disabledRoles.forEach((role) => {
        // Encontra o option que contem o text do role
        const option = within(select as HTMLElement).getByText(new RegExp(role, 'i')) as HTMLOptionElement;
        expect(option.disabled).toBe(true);
      });
    });

    it('Gestor de Acervo vê habilitados: Taxonomista de Campo, Consulente', async () => {
      await renderEditModal('Gestor de Acervo');

      const select = screen.getByLabelText('Cargo');
      ['Taxonomista de Campo', 'Consulente'].forEach((role) => {
        const option = within(select as HTMLElement).getByText(new RegExp(role, 'i')) as HTMLOptionElement;
        expect(option.disabled).toBe(false);
      });
    });

    it('Curador Mestre vê todos os cargos habilitados exceto o próprio (nível igual)', async () => {
      await renderEditModal('Curador Mestre');
      const select = screen.getByLabelText('Cargo');

      const optionCurador = within(select as HTMLElement).getByText(/Curador Mestre/i) as HTMLOptionElement;
      expect(optionCurador.disabled).toBe(true);

      const habilitados = [
        'Coordenador Científico',
        'Taxonomista Sênior',
        'Gestor de Acervo',
        'Taxonomista de Campo',
        'Consulente',
      ];

      habilitados.forEach((role) => {
        const option = within(select as HTMLElement).getByText(new RegExp(role, 'i')) as HTMLOptionElement;
        expect(option.disabled).toBe(false);
      });
    });
  });

  // --------------------------------------------------------------------------
  // GRUPO: isGlobalRole
  // --------------------------------------------------------------------------
  describe('isGlobalRole', () => {
    it.each<UserRole>(['Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior'])(
      '%s é global',
      (role) => {
        expect(isGlobalRole(role)).toBe(true);
      }
    );

    it.each<UserRole>(['Gestor de Acervo', 'Taxonomista de Campo', 'Consulente'])(
      '%s não é global',
      (role) => {
        expect(isGlobalRole(role)).toBe(false);
      }
    );
  });
});
