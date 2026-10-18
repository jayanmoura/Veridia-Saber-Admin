import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import {
  getAccessToken,
  uploadFile,
  deleteFile,
  deleteFolder,
  deleteImageVariants,
  replaceImageCleanup,
  listFiles,
} from '../../utils/storage';

// Mock do supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('storage.ts unit tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getAccessToken', () => {
    it('retorna o access token quando a sessão é válida', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'valid-token-123',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      const token = await getAccessToken();
      expect(token).toBe('valid-token-123');
    });

    it('lança erro "Sessão expirada. Faça login novamente." sem sessão', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      await expect(getAccessToken()).rejects.toThrow('Sessão expirada. Faça login novamente.');
    });

    it('lança erro "Sessão expirada. Faça login novamente." em caso de erro na sessão', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: new Error('Auth error') as unknown as import('@supabase/supabase-js').AuthError,
      });

      await expect(getAccessToken()).rejects.toThrow('Sessão expirada. Faça login novamente.');
    });
  });

  describe('uploadFile', () => {
    it('envia header Authorization com o token da sessão', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'auth-upload-token',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ url: 'https://storage.veridiasaber.com.br/bucket/test.jpg' }),
      });
      global.fetch = mockFetch;

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const url = await uploadFile('imagens-plantas', 'test.jpg', file);

      expect(url).toBe('https://storage.veridiasaber.com.br/bucket/test.jpg');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer auth-upload-token',
          }),
        })
      );
    });

    it('lança erro de sessão expirada caso receba 401', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'expired-token',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      await expect(uploadFile('imagens-plantas', 'test.jpg', file)).rejects.toThrow(
        'Sessão expirada. Faça login novamente.'
      );
    });
  });

  describe('deleteFile', () => {
    it('envia header Authorization com o token da sessão e conclui com sucesso', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'delete-token',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      await expect(deleteFile('arquivos-gerais', 'path/to/file.jpg')).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/delete'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer delete-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ bucket: 'arquivos-gerais', path: 'path/to/file.jpg' }),
        })
      );
    });

    it('tolera status 404 como sucesso sem lançar erro', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'delete-token-404',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      await expect(deleteFile('arquivos-gerais', 'non-existent.jpg')).resolves.toBeUndefined();
    });

    it('lança erro de sessão expirada caso receba 401 no delete', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'expired-token',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      await expect(deleteFile('arquivos-gerais', 'test.jpg')).rejects.toThrow(
        'Sessão expirada. Faça login novamente.'
      );
    });
  });

  describe('deleteFolder', () => {
    it('envia POST /delete-prefix e retorna a quantidade de itens apagados', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'folder-token',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ deleted: 5 }),
      });
      global.fetch = mockFetch;

      const deletedCount = await deleteFolder('arquivos-gerais', 'locais/123');
      expect(deletedCount).toBe(5);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/delete-prefix'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer folder-token',
          }),
          body: JSON.stringify({ bucket: 'arquivos-gerais', prefix: 'locais/123' }),
        })
      );
    });
  });

  describe('deleteImageVariants', () => {
    it('remove URLs duplicadas e vazias antes de chamar deleteFile', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'variants-token',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      const urls = [
        'https://storage.veridiasaber.com.br/imagens-plantas/especies/1/foto.jpg',
        'https://storage.veridiasaber.com.br/imagens-plantas/especies/1/foto.jpg', // duplicada
        '', // vazia
        null, // nula
        undefined, // indefinida
        'https://storage.veridiasaber.com.br/imagens-plantas/especies/1/thumbs/foto.jpg',
        'https://storage.veridiasaber.com.br/imagens-plantas/especies/1/micro/foto.jpg',
      ];

      await deleteImageVariants(urls);

      // Deve ter chamado fetch exatamente 3 vezes (foto, thumbs/foto, micro/foto), sem duplicada
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('propaga erro caso qualquer variante falhe (com erro diferente de 404)', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'variants-fail-token',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      global.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        const body = JSON.parse((init?.body as string) || '{}');
        if (body.path?.includes('error-file')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Internal storage error' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });
      });

      const urls = [
        'https://storage.veridiasaber.com.br/imagens-plantas/especies/1/foto.jpg',
        'https://storage.veridiasaber.com.br/imagens-plantas/especies/1/error-file.jpg',
      ];

      await expect(deleteImageVariants(urls)).rejects.toThrow('Internal storage error');
    });
  });

  describe('replaceImageCleanup', () => {
    it('ignora URLs vazias, nulas ou indefinidas', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'cleanup-token',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      await replaceImageCleanup([null, '', undefined, '   '], [null, undefined]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('não remove URLs antigas cujo caminho coincide com alguma nova URL', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'cleanup-token',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      const oldUrls = [
        'https://storage.veridiasaber.com.br/imagens-plantas/familias/mantida.jpg',
        'https://storage.veridiasaber.com.br/imagens-plantas/familias/antiga.jpg',
      ];
      const newUrls = [
        'https://storage.veridiasaber.com.br/imagens-plantas/familias/mantida.jpg',
        'https://storage.veridiasaber.com.br/imagens-plantas/familias/nova.jpg',
      ];

      await replaceImageCleanup(oldUrls, newUrls);

      // Deve ter apagado apenas 'familias/antiga.jpg'
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toEqual({
        bucket: 'imagens-plantas',
        path: 'familias/antiga.jpg',
      });
    });

    it('não chama delete se todas as antigas forem mantidas', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const oldUrls = ['https://storage.veridiasaber.com.br/arquivos-gerais/locais/1/capa.jpg'];
      const newUrls = ['https://storage.veridiasaber.com.br/arquivos-gerais/locais/1/capa.jpg'];

      await replaceImageCleanup(oldUrls, newUrls);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('propaga erro se a exclusão falhar', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'cleanup-token',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Storage delete failed' }),
      });

      await expect(
        replaceImageCleanup(
          ['https://storage.veridiasaber.com.br/imagens-plantas/familias/velha.jpg'],
          ['https://storage.veridiasaber.com.br/imagens-plantas/familias/nova.jpg']
        )
      ).rejects.toThrow('Storage delete failed');
    });
  });

  describe('listFiles', () => {
    it('envia bucket, prefix e header Authorization corretos e retorna items e truncated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'list-token-123',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      const mockItems = [
        { name: 'Raiz', path: 'Raiz', type: 'dir', file_count: 5 },
        { name: 'foto1.jpg', path: 'Raiz/foto1.jpg', type: 'file', size: 1024, modified: '2026-10-18T10:00:00Z' },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          prefix: 'Raiz',
          items: mockItems,
          truncated: true,
        }),
      });
      global.fetch = mockFetch;

      const result = await listFiles('imagens_conteudo', 'Raiz');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/list'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer list-token-123',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ bucket: 'imagens_conteudo', prefix: 'Raiz' }),
        })
      );
      expect(result.items).toEqual(mockItems);
      expect(result.truncated).toBe(true);
    });

    it('normaliza o prefix removendo barras no início e no fim', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'list-token-123',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ prefix: 'Folha', items: [], truncated: false }),
      });
      global.fetch = mockFetch;

      await listFiles('imagens_conteudo', '/Folha/');
      expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
        bucket: 'imagens_conteudo',
        prefix: 'Folha',
      });

      await listFiles('imagens_conteudo', '///Folha/subfolder///');
      expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({
        bucket: 'imagens_conteudo',
        prefix: 'Folha/subfolder',
      });
    });

    it('lança erro "Sessão expirada. Faça login novamente." caso receba 401', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'expired-token',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      await expect(listFiles('imagens_conteudo', 'Raiz')).rejects.toThrow(
        'Sessão expirada. Faça login novamente.'
      );
    });

    it('propaga a mensagem contida no corpo de erro caso a chamada falhe', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'valid-token',
          } as unknown as import('@supabase/supabase-js').Session,
        },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bucket ou caminho inválido' }),
      });

      await expect(listFiles('imagens_conteudo', 'invalido')).rejects.toThrow(
        'Bucket ou caminho inválido'
      );
    });
  });
});
