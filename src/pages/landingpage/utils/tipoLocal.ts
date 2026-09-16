export const MAPA_TIPO_LOCAL: Record<string, string> = {
  instituicao: 'Instituição',
  publico: 'Lugar Público',
};

export function formatarTipoLocal(tipo: string | null | undefined): string {
  if (!tipo) return 'Geral';
  const normalizado = tipo.trim().toLowerCase();
  return MAPA_TIPO_LOCAL[normalizado] || tipo;
}
