import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'b', 'em', 'i',
    's', 'strike', 'ul', 'ol', 'li', 'blockquote', 'hr', 'br',
    'img', 'pre', 'code', 'a'
  ],
  ALLOWED_ATTR: ['src', 'alt', 'title', 'href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|data:image\/(?:png|jpe?g|gif|webp);base64,|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
};

// Hook de segurança do DOMPurify para prevenção de reverse tabnabbing:
// Garante que qualquer link <a> com target="_blank" receba rel="noopener noreferrer"
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function sanitizeOrgaoConteudo(conteudo: string | null | undefined): string {
  const rawHtml = marked(conteudo ?? '') as string;
  return DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG);
}
