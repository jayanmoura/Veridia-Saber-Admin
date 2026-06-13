import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import * as storageUtils from '../../utils/storage';

vi.mock('../../utils/storage', () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  getStorageUrl: vi.fn((bucket, path) => `https://storage.veridiasaber.com.br/${bucket}/${path}`),
  parseStorageUrl: vi.fn(),
}));

// 1. Mock global do URL.createObjectURL e revokeObjectURL (não existem no JSDOM)
vi.stubGlobal('URL', {
  ...global.URL,
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
});

// 2. Mock dos Contextos e Hooks GLOBAIS
// Definimos uma variável mutável para rodar sobrescritas por teste
let currentProfile = { id: 'admin1', role: 'Curador Mestre', local_id: null as string | null };

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    profile: currentProfile,
  })),
}));

// Mock do supabase (usando nosso setup de src/test/mocks/supabase)
vi.mock('../../lib/supabase');
import { mockSupabaseResponse } from '../mocks/supabase';
import { supabase } from '../../lib/supabase';



// 3. Componentes e hooks testados
// Apontando para o SpeciesModalRefactored — versão refatorada em uso ativo
import { SpeciesModalRefactored } from '../../components/Modals/SpeciesModal/SpeciesModalRefactored';
import { useSpeciesImages } from '../../hooks/useSpeciesImages';
import { ToastProvider } from '../../contexts/ToastContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
);

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  initialData: undefined,
};

describe('SpeciesModal Integration Tests', () => {

  beforeEach(() => {
    vi.clearAllMocks();

    // Resetar perfil para o padrão Curador Mestre
    currentProfile = { id: 'admin1', role: 'Curador Mestre', local_id: null };

    // Setup de DB padrão (evitar loading infinito no modal)
    mockSupabaseResponse('familia', 'select', { data: [{ id: 'fam1', familia_nome: 'Acanthaceae' }], error: null });
    mockSupabaseResponse('locais', 'select', { data: [{ id: 'loc1', nome: 'Projeto X' }], error: null });
    // Na hora de salvar, insert de especie retorna um id (mock de sucesso)
    mockSupabaseResponse('especie', 'insert', { data: { id: 'nova-esp-123' }, error: null });
    mockSupabaseResponse('especie', 'update', { data: { id: 'esp-existente' }, error: null });

    // Zera o tracker do banco de mock
    if (typeof (supabase as any).__resetMockReqs === 'function') {
      (supabase as any).__resetMockReqs();
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // GRUPO: useSpeciesImages — uploadImages — estratégia de bucket
  // --------------------------------------------------------------------------
  describe('useSpeciesImages — uploadImages — estratégia de bucket', () => {

    it('isCreatingNewGlobalSpecies: true -> uploada para "imagens-plantas"', async () => {
      const { result } = renderHook(() => useSpeciesImages(), { wrapper });

      const dummyFile = new File(['dummy content'], 'foto1.jpg', { type: 'image/jpeg' });
      act(() => {
        result.current.handleFiles([dummyFile]);
      });

      const options = {
        isCreatingNewGlobalSpecies: true,
        projectId: null,
        speciesName: 'Planta Teste',
      };

      (storageUtils.uploadFile as Mock).mockResolvedValue('https://storage.veridiasaber.com.br/bucket/path.jpg');

      await act(async () => {
        await result.current.uploadImages('nova-esp-123', options);
      });

      expect(storageUtils.uploadFile).toHaveBeenCalledWith('imagens-plantas', expect.any(String), expect.any(File));
    });

    it('isCreatingNewGlobalSpecies: false com projectId -> uploada para "arquivos-gerais"', async () => {
      const { result } = renderHook(() => useSpeciesImages(), { wrapper });

      const dummyFile = new File(['dummy content'], 'foto2.jpg', { type: 'image/jpeg' });
      act(() => {
        result.current.handleFiles([dummyFile]);
      });

      const options = {
        isCreatingNewGlobalSpecies: false,
        projectId: 'loc1',
        speciesName: 'Planta Teste 2',
      };

      (storageUtils.uploadFile as Mock).mockResolvedValue('https://storage.veridiasaber.com.br/bucket/path.jpg');

      await act(async () => {
        await result.current.uploadImages('esp-existente', options);
      });

      expect(storageUtils.uploadFile).toHaveBeenCalledWith('arquivos-gerais', expect.any(String), expect.any(File));
    });
  });

  // --------------------------------------------------------------------------
  // GRUPO: useSpeciesImages — handleDeleteExistingImage — Exclusão db/storage sincronizada
  // --------------------------------------------------------------------------
  describe('useSpeciesImages — handleDeleteExistingImage — Exclusão db/storage sincronizada', () => {

    it('Se remover do storage com sucesso, exclui do DB', async () => {
      const { result } = renderHook(() => useSpeciesImages(), { wrapper });

      (storageUtils.deleteFile as Mock).mockResolvedValue(undefined);
      (storageUtils.parseStorageUrl as Mock).mockReturnValue({
        bucket: 'imagens-plantas',
        path: 'especies/esp1/foto.jpg',
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      (supabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'imagens') return { delete: mockDelete };
        return {};
      });

      const fakeUrl = 'https://xyz.supabase.co/storage/v1/object/public/imagens-plantas/especies/esp1/foto.jpg';

      await act(async () => {
        await result.current.handleDeleteExistingImage('img-id-1', fakeUrl);
      });

      expect(storageUtils.deleteFile).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // GRUPO: ProjectMap — bloqueio por local_id
  // --------------------------------------------------------------------------
  describe('ProjectMap — bloqueio por local_id (Fallback da UI para ausência de Local)', () => {
    it('Com profile.local_id: null, renderiza mensagem de acesso negado a campos do projeto', async () => {
      // Perfil Gestor (Usuário de projeto), sem local
      currentProfile = { id: 'gestor-no-local', role: 'Gestor de Acervo', local_id: null };

      render(<SpeciesModalRefactored {...defaultProps} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Nova Espécie')).toBeInTheDocument();
      });

      // O SpeciesModalRefactored delega o render do campo para SpeciesDataTab,
      // que chama getUserLocalName() do hook — retorna 'Sem permissão de local' quando local_id é null.
      const localInput = screen.getByText('Sem permissão de local');
      expect(localInput).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // GRUPO: SpeciesModalRefactored — renderização do componente
  // --------------------------------------------------------------------------
  describe('SpeciesModalRefactored — renderização do componente', () => {
    it('renderiza o modal quando isOpen: true', async () => {
      render(<SpeciesModalRefactored {...defaultProps} />, { wrapper });
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeTruthy();
      });
    });

    it('renderiza as abas "Dados da Espécie" e "Etiqueta de Herbário"', async () => {
      render(<SpeciesModalRefactored {...defaultProps} />, { wrapper });
      await waitFor(() => {
        expect(screen.getByText('Dados da Espécie')).toBeInTheDocument();
        expect(screen.getByText('Etiqueta de Herbário')).toBeInTheDocument();
      });
    });
  });
});
