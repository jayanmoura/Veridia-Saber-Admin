import { vi } from 'vitest';

// ============================================================
// BUILDER ENCADEÁVEL — supabase.from(table).select().eq()...
// ============================================================

/**
 * Mapeia { table -> { method -> mock } } para permitir sobrescrever
 * retornos por tabela e método via mockSupabaseResponse().
 */
const methodOverrides: Record<string, Record<string, { data: unknown; error: unknown }>> = {};

/** Retorna o valor configurado ou o padrão { data: null, error: null }. */
function resolveReturn(
  table: string,
  method: string,
): { data: null; error: null } | { data: unknown; error: unknown } {
  return methodOverrides[table]?.[method] ?? { data: null, error: null };
}

/**
 * Cria um builder encadeável para uma tabela específica.
 * Todos os métodos terminais resolvem com o valor configurado ou o padrão.
 */
function createQueryBuilder(table: string) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainable = (..._args: unknown[]) => builder;

  // Métodos de encadeamento — todos retornam o próprio builder
  const chainMethods = [
    'select',
    'eq',
    'neq',
    'in',
    'ilike',
    'order',
    'limit',
    'range',
    'filter',
    'match',
    'not',
    'or',
    'contains',
    'overlaps',
    'textSearch',
    'maybeSingle',
  ] as const;

  chainMethods.forEach((method) => {
    builder[method] = vi.fn(chainable);
  });

  // Métodos terminais — resolvem com Promise do valor configurado
  const terminalMethods = ['single', 'insert', 'update', 'delete', 'upsert'] as const;

  terminalMethods.forEach((method) => {
    builder[method] = vi.fn((..._args: unknown[]) =>
      Promise.resolve(resolveReturn(table, method)),
    );
  });

  // Tornar o próprio builder "thenable" (await supabase.from('x').select())
  builder.then = vi.fn((resolve: (value: unknown) => unknown) =>
    Promise.resolve(resolveReturn(table, 'select')).then(resolve),
  );

  return builder;
}

// ============================================================
// MOCK PRINCIPAL
// ============================================================
export const mockSupabase = {
  auth: {
    getSession: vi.fn(() =>
      Promise.resolve({ data: { session: null }, error: null }),
    ),
    onAuthStateChange: vi.fn((_event: unknown, _callback: unknown) => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    signInWithPassword: vi.fn(() =>
      Promise.resolve({ data: { session: null, user: null }, error: null }),
    ),
    getUser: vi.fn(() =>
      Promise.resolve({ data: { user: null }, error: null }),
    ),
  },

  from: vi.fn((table: string) => createQueryBuilder(table)),

  storage: {
    from: vi.fn((_bucket: string) => ({
      upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
      remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
      getPublicUrl: vi.fn((_path: string) => ({
        data: { publicUrl: `https://mock-storage.supabase.co/${_path}` },
      })),
      list: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },

  functions: {
    invoke: vi.fn((_fn: string, _opts?: unknown) =>
      Promise.resolve({ data: null, error: null }),
    ),
  },
};

// ============================================================
// REGISTRO GLOBAL DO MOCK
// ============================================================
vi.mock('../../lib/supabase', () => ({ supabase: mockSupabase }));

// ============================================================
// FUNÇÃO AUXILIAR — sobrescrever retorno por tabela / método
// ============================================================

/**
 * Permite sobrescrever o retorno de um método específico do builder
 * para uma tabela em tempo de teste.
 *
 * @example
 * mockSupabaseResponse('profiles', 'single', {
 *   data: { id: '1', role: 'Curador Mestre' },
 *   error: null,
 * });
 */
export function mockSupabaseResponse(
  table: string,
  method: string,
  response: { data: unknown; error: unknown },
): void {
  if (!methodOverrides[table]) {
    methodOverrides[table] = {};
  }
  methodOverrides[table][method] = response;
}

/**
 * Remove todos os overrides registrados.
 * Chame em afterEach para garantir isolamento entre testes.
 */
export function resetSupabaseMocks(): void {
  Object.keys(methodOverrides).forEach((key) => {
    delete methodOverrides[key];
  });
  vi.clearAllMocks();
}

// Alias de conveniência
export const supabase = mockSupabase;
