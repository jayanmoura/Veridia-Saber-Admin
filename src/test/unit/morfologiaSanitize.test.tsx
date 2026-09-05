import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { sanitizeOrgaoConteudo } from '../../pages/landingpage/morfologiaSanitize';

describe('Sanitização de conteúdo de Morfologia (F12: XSS em conteudo_orgaos)', () => {
  describe('1. Conteúdo Markdown legítimo', () => {
    it('deve preservar e formatar corretamente títulos, estilos, listas, links e imagens', () => {
      const markdownLegitimo = [
        '# Raiz Principal',
        '## Morfologia e Estrutura',
        '### Absorção de Nutrientes',
        'Texto com **destaque em negrito** e *termo em itálico*.',
        '- Pêlos absorventes',
        '- Coifa terminal',
        '1. Zona de alongamento',
        '2. Zona de maturação',
        '> A raiz é o órgão responsável pela fixação da planta.',
        '[Veridia Saber](https://veridiasaber.com.br)',
        '![Esquema da Raiz](https://storage.veridiasaber.com.br/imagens/raiz.jpg)'
      ].join('\n\n');

      const htmlSanitizado = sanitizeOrgaoConteudo(markdownLegitimo);

      // Verificações das tags permitidas
      expect(htmlSanitizado).toContain('<h1>Raiz Principal</h1>');
      expect(htmlSanitizado).toContain('<h2>Morfologia e Estrutura</h2>');
      expect(htmlSanitizado).toContain('<h3>Absorção de Nutrientes</h3>');
      expect(htmlSanitizado).toContain('<strong>destaque em negrito</strong>');
      expect(htmlSanitizado).toContain('<em>termo em itálico</em>');
      expect(htmlSanitizado).toContain('<ul>');
      expect(htmlSanitizado).toContain('Pêlos absorventes');
      expect(htmlSanitizado).toContain('<li>');
      expect(htmlSanitizado).toContain('<ol>');
      expect(htmlSanitizado).toContain('Zona de alongamento');
      expect(htmlSanitizado).toContain('<blockquote>');
      expect(htmlSanitizado).toContain('<a href="https://veridiasaber.com.br">Veridia Saber</a>');
      expect(htmlSanitizado).toContain('src="https://storage.veridiasaber.com.br/imagens/raiz.jpg"');
      expect(htmlSanitizado).toContain('alt="Esquema da Raiz"');
    });

    it('deve permitir imagens inline com base64 suportadas pelo TipTap', () => {
      const imagemBase64 = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Ponto" />';
      const htmlSanitizado = sanitizeOrgaoConteudo(imagemBase64);

      expect(htmlSanitizado).toContain('src="data:image/png;base64,');
      expect(htmlSanitizado).toContain('alt="Ponto"');
    });
  });

  describe('2. Payloads maliciosos simulando banco de dados comprometido', () => {
    it('deve remover tag <script> e atributo onerror de <img>', () => {
      const payloadMalicioso = '<script>alert("xss")</script><img src="x" onerror="alert(1)">';
      const htmlSanitizado = sanitizeOrgaoConteudo(payloadMalicioso);

      expect(htmlSanitizado).not.toContain('<script>');
      expect(htmlSanitizado).not.toContain('alert("xss")');
      expect(htmlSanitizado).not.toContain('onerror');
      expect(htmlSanitizado).toContain('<img src="x">');
    });

    it('deve bloquear URLs com esquema javascript: em links', () => {
      const payloadLinkJavascript = '[Clique aqui](javascript:alert(document.cookie))';
      const htmlSanitizado = sanitizeOrgaoConteudo(payloadLinkJavascript);

      expect(htmlSanitizado).not.toContain('javascript:');
      expect(htmlSanitizado).not.toContain('alert(document.cookie)');
    });

    it('deve remover tags não autorizadas como <iframe>, <object>, <embed> e <svg>', () => {
      const payloadTagsPerigosas = [
        '<iframe src="https://atacante.com/exploit"></iframe>',
        '<svg onload="alert(1)"><circle r="10"/></svg>',
        '<object data="malicioso.swf"></object>',
        '<embed src="malicioso.pdf">'
      ].join('\n');

      const htmlSanitizado = sanitizeOrgaoConteudo(payloadTagsPerigosas);

      expect(htmlSanitizado).not.toContain('<iframe');
      expect(htmlSanitizado).not.toContain('<svg');
      expect(htmlSanitizado).not.toContain('onload');
      expect(htmlSanitizado).not.toContain('<object');
      expect(htmlSanitizado).not.toContain('<embed');
    });

    it('deve remover manipuladores de eventos embutidos (onclick, onmouseover, onload)', () => {
      const payloadHandlers = '<p onclick="alert(1)" onmouseover="stealData()">Texto suspeito</p>';
      const htmlSanitizado = sanitizeOrgaoConteudo(payloadHandlers);

      expect(htmlSanitizado).not.toContain('onclick');
      expect(htmlSanitizado).not.toContain('onmouseover');
      expect(htmlSanitizado).toContain('<p>Texto suspeito</p>');
    });
  });

  describe('3. Prevenção de Reverse Tabnabbing em links', () => {
    it('deve forçar rel="noopener noreferrer" em links com target="_blank"', () => {
      const linkTargetBlank = '<a href="https://externo.com" target="_blank">Artigo Externo</a>';
      const htmlSanitizado = sanitizeOrgaoConteudo(linkTargetBlank);

      expect(htmlSanitizado).toContain('target="_blank"');
      expect(htmlSanitizado).toContain('rel="noopener noreferrer"');
    });

    it('deve sobrescrever rel inseguro se target="_blank" for fornecido', () => {
      const linkComRelInseguro = '<a href="https://externo.com" target="_blank" rel="help">Documentação</a>';
      const htmlSanitizado = sanitizeOrgaoConteudo(linkComRelInseguro);

      expect(htmlSanitizado).toContain('target="_blank"');
      expect(htmlSanitizado).toContain('rel="noopener noreferrer"');
    });

    it('não deve forçar rel em links sem target="_blank"', () => {
      const linkNormal = '<a href="https://veridiasaber.com.br">Início</a>';
      const htmlSanitizado = sanitizeOrgaoConteudo(linkNormal);

      expect(htmlSanitizado).not.toContain('rel=');
    });
  });

  describe('4. Renderização com dangerouslySetInnerHTML no DOM', () => {
    it('deve renderizar nós limpos no DOM sem executar ou manter scripts', () => {
      const input = '## Caule\n\n<script>window.evilExecuted = true;</script><p>Estrutura de suporte</p>';
      const sanitized = sanitizeOrgaoConteudo(input);

      const { container } = render(<div dangerouslySetInnerHTML={{ __html: sanitized }} />);

      const heading = container.querySelector('h2');
      const paragraph = container.querySelector('p');
      const script = container.querySelector('script');

      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('Caule');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('Estrutura de suporte');
      expect(script).toBeNull();
    });

    it('deve lidar graciosamente com conteúdo vazio ou nulo', () => {
      expect(sanitizeOrgaoConteudo(null)).toBe('');
      expect(sanitizeOrgaoConteudo(undefined)).toBe('');
      expect(sanitizeOrgaoConteudo('')).toBe('');
    });
  });
});
