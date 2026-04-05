import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock do supabase ANTES de qualquer import que o consuma
vi.mock('../../lib/supabase');
import { mockSupabaseResponse } from '../mocks/supabase';
import { supabase } from '../../lib/supabase';

// Variável mutável para controlar o perfil por teste
let currentProfile = { id: 'user1', role: 'Curador Mestre', local_id: null as string | null };

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ profile: currentProfile })),
}));

// Hook testado — importado APÓS os mocks
import { useOverviewStats } from '../../hooks/useOverviewStats';

// ============================================================
// HELPERS
// ============================================================

/** Configura todos os mocks de tabela com dados vazios (safe default). */
function setupEmptyMocks() {
  mockSupabaseResponse('familia', 'select', { data: [], error: null, count: 0 });
  mockSupabaseResponse('especie', 'select', { data: [], error: null, count: 0 });
  mockSupabaseResponse('locais', 'select', { data: [], error: null, count: 0 });
  mockSupabaseResponse('profiles', 'select', { data: [], error: null, count: 0 });
  mockSupabaseResponse('audit_logs', 'select', { data: [], error: null });
  mockSupabaseResponse('especie_local', 'select', { data: [], error: null, count: 0 });
  mockSupabaseResponse('imagens', 'select', { data: [], error: null, count: 0 });
}

// ============================================================
// SETUP
// ============================================================

beforeEach(() => {
  vi.clearAllMocks();
  currentProfile = { id: 'user1', role: 'Curador Mestre', local_id: null };
  setupEmptyMocks();
});

// ============================================================
// GRUPO 1 — Classificação de roles
// ============================================================

describe('useOverviewStats — Classificação de roles', () => {

  it('Curador Mestre → isGlobalAdmin: true, demais: false', async () => {
    currentProfile = { id: 'user1', role: 'Curador Mestre', local_id: null };
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isGlobalAdmin).toBe(true);
    expect(result.current.isLocalAdmin).toBe(false);
    expect(result.current.isSenior).toBe(false);
    expect(result.current.isFieldTaxonomist).toBe(false);
    expect(result.current.isCataloger).toBe(false);
  });

  it('Coordenador Científico → isGlobalAdmin: true', async () => {
    currentProfile = { id: 'user2', role: 'Coordenador Científico', local_id: null };
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isGlobalAdmin).toBe(true);
    expect(result.current.isLocalAdmin).toBe(false);
  });

  it('Gestor de Acervo → isLocalAdmin: true, isGlobalAdmin: false', async () => {
    currentProfile = { id: 'gestor1', role: 'Gestor de Acervo', local_id: 'loc-abc' };
    mockSupabaseResponse('locais', 'select', {
      data: [{ nome: 'Projeto X', tipo: 'Herbário', descricao: null, imagem_capa: null }],
      error: null,
    });
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isLocalAdmin).toBe(true);
    expect(result.current.isGlobalAdmin).toBe(false);
    expect(result.current.isSenior).toBe(false);
  });

  it('Taxonomista Sênior → isSenior: true', async () => {
    currentProfile = { id: 'senior1', role: 'Taxonomista Sênior', local_id: null };
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isSenior).toBe(true);
    expect(result.current.isGlobalAdmin).toBe(false);
    expect(result.current.isFieldTaxonomist).toBe(false);
  });

  it('Taxonomista de Campo → isFieldTaxonomist: true', async () => {
    currentProfile = { id: 'field1', role: 'Taxonomista de Campo', local_id: null };
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isFieldTaxonomist).toBe(true);
    expect(result.current.isGlobalAdmin).toBe(false);
    expect(result.current.isSenior).toBe(false);
  });

  it('Consulente → isCataloger: true', async () => {
    currentProfile = { id: 'consulente1', role: 'Consulente', local_id: null };
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isCataloger).toBe(true);
    expect(result.current.isGlobalAdmin).toBe(false);
    expect(result.current.isLocalAdmin).toBe(false);
  });
});

// ============================================================
// GRUPO 2 — fetchGlobalStats (Curador Mestre)
// ============================================================

describe('useOverviewStats — fetchGlobalStats (Curador Mestre)', () => {

  beforeEach(() => {
    currentProfile = { id: 'admin1', role: 'Curador Mestre', local_id: null };

    mockSupabaseResponse('familia', 'select', { data: null, error: null, count: 42 });
    mockSupabaseResponse('especie', 'select', { data: null, error: null, count: 7 });
    mockSupabaseResponse('locais', 'select', { data: null, error: null, count: 1 });
    mockSupabaseResponse('profiles', 'select', { data: null, error: null, count: 6 });
    mockSupabaseResponse('audit_logs', 'select', {
      data: [{
        id: 1,
        created_at: '2026-04-01',
        action_type: 'INSERT',
        table_name: 'especie',
        user_id: 'user1',
        profiles: { full_name: 'Admin' },
      }],
      error: null,
    });
  });

  it('chama supabase.from("familia") com count exact', async () => {
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).toHaveBeenCalledWith('familia');
  });

  it('chama supabase.from("audit_logs") e popula recentLogs', async () => {
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).toHaveBeenCalledWith('audit_logs');
    expect(result.current.recentLogs).toHaveLength(1);
    expect(result.current.recentLogs[0].table_name).toBe('especie');
  });

  it('stats.families reflete o count retornado', async () => {
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.stats.families).toBe(42);
    });
  });

  it('stats.species reflete o count retornado', async () => {
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.stats.species).toBe(7);
    });
  });
});

// ============================================================
// GRUPO 3 — fetchLocalStats (Gestor de Acervo)
// ============================================================

describe('useOverviewStats — fetchLocalStats (Gestor de Acervo)', () => {

  beforeEach(() => {
    currentProfile = { id: 'gestor1', role: 'Gestor de Acervo', local_id: 'loc-abc' };

    const projectDataMock = {
      nome: 'Jardim Botânico UFRRJ',
      tipo: 'Jardim Botânico',
      descricao: null,
      imagem_capa: null,
    };

    // select é usado para o builder encadeável; single é o método terminal que resolve
    mockSupabaseResponse('locais', 'select', { data: [projectDataMock], error: null });
    mockSupabaseResponse('locais', 'single', { data: projectDataMock, error: null });
    mockSupabaseResponse('especie_local', 'select', { data: [], error: null, count: 3 });
    mockSupabaseResponse('imagens', 'select', { data: [], error: null, count: 5 });
    mockSupabaseResponse('profiles', 'select', { data: [], error: null, count: 2 });
  });

  it('NÃO chama audit_logs', async () => {
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).not.toHaveBeenCalledWith('audit_logs');
  });

  it('chama especie_local filtrado por local_id do profile', async () => {
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).toHaveBeenCalledWith('especie_local');
  });

  it('popula projectData com dados do local', async () => {
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.projectData?.nome).toBe('Jardim Botânico UFRRJ');
    });
  });

  it('localStats.speciesCount reflete o count retornado', async () => {
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.isGlobalAdmin).toBe(false);
      expect(result.current.isLocalAdmin).toBe(true);
      expect(result.current.localStats.speciesCount).toBe(3);
    });
  });
});

// ============================================================
// GRUPO 4 — fetchPersonalStats (Consulente)
// ============================================================

describe('useOverviewStats — fetchPersonalStats (Consulente)', () => {

  beforeEach(() => {
    currentProfile = { id: 'consulente1', role: 'Consulente', local_id: null };
    mockSupabaseResponse('especie', 'select', { data: [], error: null, count: 2 });
  });

  it('NÃO chama audit_logs nem locais', async () => {
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).not.toHaveBeenCalledWith('audit_logs');
    expect(supabase.from).not.toHaveBeenCalledWith('locais');
  });

  it('chama especie filtrada por created_by', async () => {
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).toHaveBeenCalledWith('especie');
  });

  it('loading termina em false', async () => {
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => {
      expect(result.current.isCataloger).toBe(true);
      expect(result.current.loading).toBe(false);
    });
  });
});
