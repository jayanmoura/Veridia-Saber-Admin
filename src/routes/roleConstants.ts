// Global admin route permission matrix.
// Dashboard, project detail, and local/project-scoped routes remain under PrivateRoute only.
export const GLOBAL_MANAGEMENT_ROLES = ['Curador Mestre', 'Coordenador Científico'] as const;
export const SCIENTIFIC_CATALOG_ROLES = [
  'Curador Mestre',
  'Coordenador Científico',
  'Taxonomista Sênior',
  'Gestor de Acervo',
  'Taxonomista de Campo'
] as const;
export const USER_MANAGEMENT_ROLES = [
  'Curador Mestre',
  'Coordenador Científico',
  'Gestor de Acervo'
] as const;

export const GLOBAL_MAP_ROLES = ['Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior', 'Gestor de Acervo', 'Taxonomista de Campo'] as const;
