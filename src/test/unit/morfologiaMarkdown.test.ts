import { describe, it, expect } from 'vitest';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { normalizeOrgaoMarkdown } from '../../pages/landingpage/morfologiaMarkdown';
import { SANITIZE_CONFIG, sanitizeOrgaoConteudo } from '../../pages/landingpage/morfologiaSanitize';

describe('normalizeOrgaoMarkdown', () => {
  it('deve inserir linha em branco no caso de lista colada ao </h2>', () => {
    const input = '<h2>Principais funções:</h2>\n- **Fixação**: fixar a planta\n- **Absorção**: absorver nutrientes';
    const expected = '<h2>Principais funções:</h2>\n\n- **Fixação**: fixar a planta\n- **Absorção**: absorver nutrientes';

    expect(normalizeOrgaoMarkdown(input)).toBe(expected);
  });

  it('deve inserir linha em branco no caso de parágrafo colado à tag de heading', () => {
    const input = '<h2>Definição</h2>\nA raiz é o órgão vegetal subterrâneo responsável pela fixação.';
    const expected = '<h2>Definição</h2>\n\nA raiz é o órgão vegetal subterrâneo responsável pela fixação.';

    expect(normalizeOrgaoMarkdown(input)).toBe(expected);
  });

  it('deve inserir linha em branco no caso de texto em **negrito** colado à tag de heading', () => {
    const input = '<h3>Atenção:</h3>\n**Importante**: observar com lupa a zona pilífera.';
    const expected = '<h3>Atenção:</h3>\n\n**Importante**: observar com lupa a zona pilífera.';

    expect(normalizeOrgaoMarkdown(input)).toBe(expected);
  });

  it('não deve alterar conteúdo que já tem linha em branco após a tag de heading', () => {
    const input = '<h2>Zona de Maturação</h2>\n\n- Pêlos radiculares absorventes\n- Coifa protetora';

    expect(normalizeOrgaoMarkdown(input)).toBe(input);
  });

  it('deve normalizar CRLF (\\r\\n) para LF (\\n) e separar blocos colados', () => {
    const input = '  <h2>Principais funções:</h2>\r\n  - **Fixação**: fixação ao solo\r\n  - **Absorção**: absorção hídrica';
    const expected = '  <h2>Principais funções:</h2>\n\n  - **Fixação**: fixação ao solo\n  - **Absorção**: absorção hídrica';

    expect(normalizeOrgaoMarkdown(input)).toBe(expected);
  });

  it('deve ser idempotente (aplicar duas vezes resulta no mesmo texto)', () => {
    const input = '<h2>Principais funções:</h2>\r\n- **Fixação**: sustentação\r\n- **Absorção**: água e sais';
    const primeiraPassada = normalizeOrgaoMarkdown(input);
    const segundaPassada = normalizeOrgaoMarkdown(primeiraPassada);

    expect(segundaPassada).toBe(primeiraPassada);
  });

  it('deve suportar todas as tags de heading (h1 a h6)', () => {
    const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    for (const tag of headings) {
      const input = `<${tag}>Título</${tag}>\nTexto imediatamente colado`;
      const expected = `<${tag}>Título</${tag}>\n\nTexto imediatamente colado`;
      expect(normalizeOrgaoMarkdown(input)).toBe(expected);
    }
  });

  it('deve retornar string vazia caso o input seja vazio', () => {
    expect(normalizeOrgaoMarkdown('')).toBe('');
  });

  describe('Integração (normalize + marked + sanitize)', () => {
    it('deve gerar <ul><li><strong>Fixação e não conter "**" nem "- " literais', () => {
      const inputComBug = '  <h2>Principais funções:</h2>\r\n  - **Fixação**: fixar a planta no substrato\r\n  - **Absorção**: retirar água e sais do solo';

      // Pipeline completo: normalize -> marked -> sanitize
      const normalized = normalizeOrgaoMarkdown(inputComBug);
      const rawHtml = marked(normalized) as string;
      const htmlSanitizado = DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG);

      // Verificações solicitadas
      expect(htmlSanitizado).toContain('<ul>');
      expect(htmlSanitizado).toContain('<li><strong>Fixação</strong>: fixar a planta no substrato</li>');
      expect(htmlSanitizado).not.toContain('**');
      expect(htmlSanitizado).not.toContain('- ');

      // Também verifica com a função sanitizeOrgaoConteudo
      const htmlViaHelper = sanitizeOrgaoConteudo(inputComBug);
      expect(htmlViaHelper).toContain('<ul>');
      expect(htmlViaHelper).toContain('<li><strong>Fixação</strong>: fixar a planta no substrato</li>');
      expect(htmlViaHelper).not.toContain('**');
      expect(htmlViaHelper).not.toContain('- ');
    });
  });
});
