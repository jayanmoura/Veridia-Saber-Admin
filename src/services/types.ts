export type { Species, Specimen } from '../types/domain';

export interface SpecimenFilters {
    localId?: number | string;
    especieId?: string;
    limit?: number;
    withCoordinates?: boolean;
}
