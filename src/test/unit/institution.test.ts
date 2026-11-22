import { describe, it, expect, beforeEach } from 'vitest';
import '../mocks/supabase';
import { mockSupabase, mockSupabaseResponse, resetSupabaseMocks } from '../mocks/supabase';
import { supabase } from '../../lib/supabase';
import {
  DEFAULT_INSTITUTION_NAME,
  getDefaultInstitutionId,
  clearInstitutionCache,
} from '../../config/institution';

describe('institution.ts unit tests', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    clearInstitutionCache();
  });

  it('retorna o id da instituição padrão e usa o cache nas chamadas seguintes', async () => {
    mockSupabaseResponse('institutions', 'select', {
      data: { id: 'inst-uuid-123' },
      error: null,
    });

    const firstId = await getDefaultInstitutionId(supabase);
    const secondId = await getDefaultInstitutionId(supabase);

    expect(firstId).toBe('inst-uuid-123');
    expect(secondId).toBe('inst-uuid-123');
    expect(mockSupabase.from).toHaveBeenCalledTimes(1);
  });

  it('retorna null quando não encontra a instituição', async () => {
    mockSupabaseResponse('institutions', 'select', {
      data: null,
      error: null,
    });

    const result = await getDefaultInstitutionId(supabase);
    expect(result).toBeNull();
  });

  it('retorna null em caso de erro na consulta', async () => {
    mockSupabaseResponse('institutions', 'select', {
      data: null,
      error: { message: 'Database error' },
    });

    const result = await getDefaultInstitutionId(supabase);
    expect(result).toBeNull();
  });

  it("filtra por 'name' = 'Veridia Saber (Legado)'", async () => {
    mockSupabaseResponse('institutions', 'select', {
      data: { id: 'inst-uuid-123' },
      error: null,
    });

    await getDefaultInstitutionId(supabase);

    expect(mockSupabase.from).toHaveBeenCalledWith('institutions');
    const builder = mockSupabase.from.mock.results[0]?.value;
    expect(builder.select).toHaveBeenCalledWith('id');
    expect(builder.eq).toHaveBeenCalledWith('name', 'Veridia Saber (Legado)');
    expect(DEFAULT_INSTITUTION_NAME).toBe('Veridia Saber (Legado)');
    expect(builder.maybeSingle).toHaveBeenCalledTimes(1);
  });
});
