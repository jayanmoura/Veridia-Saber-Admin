/**
 * Normaliza Markdown de conteúdo de órgãos morfológicos.
 *
 * Corrige problema com CommonMark onde blocos HTML (h1-h6) seguidos
 * imediatamente de texto Markdown (sem linha em branco) não têm seu Markdown
 * parseado pelo marked (ex: listas com marcadores - **texto**).
 */
export function normalizeOrgaoMarkdown(md: string): string {
  if (!md) return '';

  const normalizedEol = md.replace(/\r\n/g, '\n');
  return normalizedEol.replace(/(<\/h[1-6]>)[ \t]*\n(?=[ \t]*\S)/gi, '$1\n\n');
}
