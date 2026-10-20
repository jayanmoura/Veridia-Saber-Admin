import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock do supabase ANTES de qualquer import que o consuma
vi.mock('../../lib/supabase');
import { mockSupabaseResponse } from '../mocks/supabase';
import { supabase } from '../../lib/supabase';

// Variável mutável para controlar o perfil por teste
let currentProfile = { id: 'user1', role: 'Curador Mestre', local_id: null as string | null };

vi.mock('../../contexts/authContext', () => ({
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

  it('Consulente → nenhum supabase.from é chamado e todas as flags de papel são false', async () => {
    currentProfile = { id: 'consulente1', role: 'Consulente', local_id: null };
    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).not.toHaveBeenCalled();
    expect(result.current.isGlobalAdmin).toBe(false);
    expect(result.current.isLocalAdmin).toBe(false);
    expect(result.current.isSenior).toBe(false);
    expect(result.current.isFieldTaxonomist).toBe(false);
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
// GRUPO 5 — fetchSeniorStats (Taxonomista Sênior)
// ============================================================

describe('useOverviewStats — fetchSeniorStats (Taxonomista Sênior)', () => {

  beforeEach(() => {
    currentProfile = { id: 'senior1', role: 'Taxonomista Sênior', local_id: null };
  });

  it('select de recentWork não usa profiles e o nome vem de created_by_name', async () => {
    mockSupabaseResponse('especie', 'select', {
      data: [
        {
          id: 'sp-1',
          nome_especie: 'Handroanthus albus',
          status: 'ativo',
          created_at: '2026-04-01T10:00:00Z',
          created_by: 'user-tax-1',
          created_by_name: 'Dra. Maria Botânica',
          familia: { familia_nome: 'Bignoniaceae' },
          imagens: [],
          especie_local: [],
        },
      ],
      error: null,
      count: 0,
    });

    mockSupabaseResponse('familia', 'select', {
      data: [
        {
          id: 'fam-1',
          familia_nome: 'Fabaceae',
          status: 'ativo',
          created_at: '2026-04-01T09:00:00Z',
          created_by: 'user-tax-2',
          created_by_name: 'Dr. João Silvicultura',
        },
      ],
      error: null,
      count: 0,
    });

    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Garante que o select para especie e familia não utiliza o join inválido com profiles
    const fromMock = supabase.from as ReturnType<typeof vi.fn>;
    fromMock.mock.calls.forEach((args, idx) => {
      const table = args[0];
      if (table === 'especie' || table === 'familia') {
        const builder = fromMock.mock.results[idx].value as {
          select: { mock: { calls: unknown[][] } };
        };
        builder.select.mock.calls.forEach((selectArgs: unknown[]) => {
          const selectStr = selectArgs[0];
          if (typeof selectStr === 'string') {
            expect(selectStr).not.toContain('profiles');
          }
        });
      }
    });

    // Garante que recentWork veio preenchido com created_by_name e creator.full_name
    expect(result.current.recentWork).toHaveLength(2);
    const especieWork = result.current.recentWork.find((w) => w.type === 'especie');
    const familiaWork = result.current.recentWork.find((w) => w.type === 'familia');

    expect(especieWork?.created_by_name).toBe('Dra. Maria Botânica');
    if (especieWork?.creator && !Array.isArray(especieWork.creator)) {
      expect(especieWork.creator.full_name).toBe('Dra. Maria Botânica');
    }

    expect(familiaWork?.created_by_name).toBe('Dr. João Silvicultura');
    if (familiaWork?.creator && !Array.isArray(familiaWork.creator)) {
      expect(familiaWork.creator.full_name).toBe('Dr. João Silvicultura');
    }
  });

  it('completa com fetchProfileNames via RPC quando created_by_name vier vazio e houver created_by', async () => {
    mockSupabaseResponse('especie', 'select', {
      data: [
        {
          id: 'sp-2',
          nome_especie: 'Paubrasilia echinata',
          status: 'ativo',
          created_at: '2026-04-01T12:00:00Z',
          created_by: 'user-resolved-rpc',
          created_by_name: null,
          familia: { familia_nome: 'Fabaceae' },
          imagens: [],
          especie_local: [],
        },
      ],
      error: null,
      count: 0,
    });

    // Mock do retorno da RPC get_profile_names
    const rpcMock = supabase.rpc as ReturnType<typeof vi.fn>;
    rpcMock.mockImplementationOnce(() =>
      Promise.resolve({
        data: [{ id: 'user-resolved-rpc', full_name: 'Dra. Resolved via RPC' }],
        error: null,
      }),
    );

    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const especieWork = result.current.recentWork.find((w) => w.id === 'sp-2');
    expect(especieWork?.created_by_name).toBe('Dra. Resolved via RPC');
    if (especieWork?.creator && !Array.isArray(especieWork.creator)) {
      expect(especieWork.creator.full_name).toBe('Dra. Resolved via RPC');
    }
  });

  it('continua usando o fluxo antigo (consulta familia e especies globais com local_id null, sem especie_local)', async () => {
    mockSupabaseResponse('especie', 'select', {
      data: [
        {
          id: 'sp-global-1',
          nome_cientifico: 'Araucaria angustifolia',
          descricao_especie: '',
          created_at: '2026-04-01T10:00:00Z',
          created_by: 'senior1',
          created_by_name: 'Dr. Sênior',
          familia: { familia_nome: 'Araucariaceae' },
          imagens: [],
        },
      ],
      error: null,
      count: 10,
    });
    mockSupabaseResponse('familia', 'select', {
      data: [],
      error: null,
      count: 4,
    });

    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).toHaveBeenCalledWith('especie');
    expect(supabase.from).toHaveBeenCalledWith('familia');
    expect(supabase.from).not.toHaveBeenCalledWith('especie_local');

    const fromMock = supabase.from as ReturnType<typeof vi.fn>;
    const usedIsLocalIdNull = fromMock.mock.calls.some((args, idx) => {
      if (args[0] !== 'especie') return false;
      const builder = fromMock.mock.results[idx].value as {
        is: { mock: { calls: unknown[][] } };
      };
      return builder.is.mock.calls.some(
        (call) => call[0] === 'local_id' && call[1] === null,
      );
    });
    expect(usedIsLocalIdNull).toBe(true);
    expect(result.current.stats.species).toBe(10);
    expect(result.current.stats.seniorContributions).toBe(14);
    expect(result.current.stats.seniorPending).toBe(1);
    expect(result.current.pendingSpecies).toHaveLength(1);
  });
});

// ============================================================
// GRUPO 6 — fetchFieldStats (Taxonomista de Campo)
// ============================================================

describe('useOverviewStats — fetchFieldStats (Taxonomista de Campo)', () => {

  it('usa filtros por created_by e local_id, NÃO consulta espécies globais nem familia e preenche stats e recentWork', async () => {
    currentProfile = { id: 'field1', role: 'Taxonomista de Campo', local_id: '41' };

    mockSupabaseResponse('especie', 'select', {
      data: [
        {
          id: 'sp-local-1',
          nome_cientifico: 'Eugenia uniflora',
          created_at: '2026-10-19T12:00:00Z',
          local_id: 41,
          familia_id: 'fam-myrt',
          familia: { familia_nome: 'Myrtaceae' },
          created_by: 'field1',
          created_by_name: 'Taxonomista Local',
        },
      ],
      error: null,
      count: 5,
    });
    mockSupabaseResponse('especie_local', 'select', {
      data: [],
      error: null,
      count: 8,
    });

    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).toHaveBeenCalledWith('especie');
    expect(supabase.from).toHaveBeenCalledWith('especie_local');
    expect(supabase.from).not.toHaveBeenCalledWith('familia');
    expect(supabase.from).not.toHaveBeenCalledWith('audit_logs');

    const fromMock = supabase.from as ReturnType<typeof vi.fn>;
    const eqCalls: Array<{ table: string; args: unknown[] }> = [];

    fromMock.mock.calls.forEach((args, idx) => {
      const table = String(args[0]);
      const builder = fromMock.mock.results[idx].value as {
        is: { mock: { calls: unknown[][] } };
        eq: { mock: { calls: unknown[][] } };
      };

      // Nenhuma query do Campo deve buscar espécies globais (local_id IS NULL)
      expect(builder.is).not.toHaveBeenCalled();

      // Todas as queries em especie / especie_local devem filtrar por local_id = 41
      expect(builder.eq).toHaveBeenCalledWith('local_id', 41);

      builder.eq.mock.calls.forEach((callArgs: unknown[]) => {
        eqCalls.push({ table, args: callArgs });
      });
    });

    // Verifica que filtrou por created_by = 'field1' tanto em especie quanto em especie_local
    expect(
      eqCalls.some((c) => c.table === 'especie' && c.args[0] === 'created_by' && c.args[1] === 'field1'),
    ).toBe(true);
    expect(
      eqCalls.some((c) => c.table === 'especie_local' && c.args[0] === 'created_by' && c.args[1] === 'field1'),
    ).toBe(true);

    expect(result.current.stats.species).toBe(5);
    expect(result.current.stats.specimens).toBe(8);
    expect(result.current.stats.seniorContributions).toBe(13);
    expect(result.current.stats.seniorPending).toBe(0);
    expect(result.current.pendingSpecies).toEqual([]);
    expect(result.current.recentWork).toHaveLength(1);
    expect(result.current.recentWork[0].type).toBe('especie');
    expect(result.current.recentWork[0].created_by_name).toBe('Taxonomista Local');
  });

  it('sem local_id não quebra, não faz queries e devolve zeros', async () => {
    currentProfile = { id: 'field-sem-local', role: 'Taxonomista de Campo', local_id: null };

    const { result } = renderHook(() => useOverviewStats());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).not.toHaveBeenCalled();
    expect(result.current.stats.species).toBe(0);
    expect(result.current.stats.specimens).toBe(0);
    expect(result.current.stats.seniorContributions).toBe(0);
    expect(result.current.stats.seniorPending).toBe(0);
    expect(result.current.recentWork).toEqual([]);
    expect(result.current.pendingSpecies).toEqual([]);
  });
});



