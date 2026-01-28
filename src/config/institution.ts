/**
 * Institution Configuration
 * 
 * The default institution is used as a fallback when creating new entities.
 * This serves as the primary tenant for the Veridia Saber platform.
 */

// Default institution name - must match exactly in the database
export const DEFAULT_INSTITUTION_NAME = 'Veridia Saber (Legado)';

// This will be fetched from the database at runtime
// The value below is a placeholder that will be overwritten
let cachedDefaultInstitutionId: string | null = null;

/**
 * Fetches the default institution ID from the database.
 * Caches the result for subsequent calls.
 */
export async function getDefaultInstitutionId(supabase: any): Promise<string | null> {
    if (cachedDefaultInstitutionId) {
        return cachedDefaultInstitutionId;
    }

    try {
        const { data, error } = await supabase
            .from('institutions')
            .select('id')
            .eq('nome', DEFAULT_INSTITUTION_NAME)
            .single();

        if (error) {
            console.error('Error fetching default institution:', error);
            return null;
        }

        cachedDefaultInstitutionId = data?.id || null;
        return cachedDefaultInstitutionId;
    } catch (err) {
        console.error('Error getting default institution:', err);
        return null;
    }
}

/**
 * Clears the cached institution ID.
 * Useful for testing or when the institution changes.
 */
export function clearInstitutionCache(): void {
    cachedDefaultInstitutionId = null;
}
