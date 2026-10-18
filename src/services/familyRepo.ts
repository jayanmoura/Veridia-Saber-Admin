import { supabase } from '../lib/supabase';
import type { Family } from '../types/domain';

export const familyRepo = {
  /**
   * Get full family data for editing in modals
   */
  async getFamilyById(id: string): Promise<Family> {
    const { data, error } = await supabase
      .from('familia')
      .select('*, especie(count)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Family;
  },
};
