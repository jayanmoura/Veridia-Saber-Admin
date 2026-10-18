import { supabase } from '../lib/supabase';

const STORAGE_URL = import.meta.env.VITE_STORAGE_URL;
const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL;

/**
 * Obtém o access token da sessão ativa do Supabase.
 * Lança erro caso a sessão não exista ou esteja expirada.
 */
export async function getAccessToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  return session.access_token;
}

/**
 * Constrói a URL pública de leitura para um arquivo no storage
 */
export function getStorageUrl(bucket: string, path: string): string {
  // Remove barras duplas caso existam
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${STORAGE_URL}/${bucket}/${cleanPath}`;
}

/**
 * Extrai bucket e path de uma URL completa do storage.
 * Suporta tanto URLs antigas do Supabase quanto do novo storage.
 * Retorna null se não reconhecer o padrão.
 */
export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const urlObj = new URL(url);

    // Verifica URLs do Supabase (ex: https://xxx.supabase.co/storage/v1/object/public/bucket/path)
    if (urlObj.hostname.endsWith('supabase.co')) {
      const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
      if (match) {
        return { bucket: match[1], path: match[2] };
      }
    }

    // Verifica URLs do Storage Self-hosted (ex: https://storage.veridiasaber.com.br/bucket/path)
    if (urlObj.hostname === 'storage.veridiasaber.com.br' || urlObj.href.startsWith(STORAGE_URL)) {
      // pathname começa com /
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const bucket = parts[0];
        const path = parts.slice(1).join('/');
        return { bucket, path };
      }
    }

    // Fallback genérico para a estrutura antiga de buckets (imagens-plantas, arquivos-gerais, etc)
    const bucketMatch = url.match(/\/(imagens-plantas|arquivos-gerais|fotos-das-colecoes|imagens_conteudo)\/(.+)$/);
    if (bucketMatch) {
      return { bucket: bucketMatch[1], path: bucketMatch[2] };
    }

    return null;
  } catch {
    // Se a URL for inválida ou relativa, tenta o fallback
    const bucketMatch = url.match(/\/(imagens-plantas|arquivos-gerais|fotos-das-colecoes|imagens_conteudo)\/(.+)$/);
    if (bucketMatch) {
      return { bucket: bucketMatch[1], path: bucketMatch[2] };
    }
    return null;
  }
}

/**
 * Faz upload de um arquivo para o storage self-hosted.
 * Retorna a URL pública do arquivo salvo.
 */
export async function uploadFile(bucket: string, path: string, file: File | Blob): Promise<string> {
  const token = await getAccessToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  formData.append('path', path);

  const response = await fetch(`${UPLOAD_API_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Nota: não definir Content-Type ao enviar FormData com fetch, o browser define automaticamente o boundary
    },
    body: formData,
  });

  if (response.status === 401) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    throw new Error(errObj.error || `Erro HTTP no upload: ${response.status}`);
  }

  const data = await response.json();
  return data.url;
}

/**
 * Deleta um arquivo do storage self-hosted.
 * Trata status 404 como sucesso (arquivo já não existe).
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const token = await getAccessToken();
  const response = await fetch(`${UPLOAD_API_URL}/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ bucket, path }),
  });

  if (response.status === 401) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? `Delete failed: ${response.status}`);
  }
}

/**
 * Deleta uma pasta inteira no storage self-hosted via /delete-prefix.
 * Retorna o número de arquivos apagados.
 */
export async function deleteFolder(bucket: string, prefix: string): Promise<number> {
  const token = await getAccessToken();
  const response = await fetch(`${UPLOAD_API_URL}/delete-prefix`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ bucket, prefix }),
  });

  if (response.status === 401) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? `Delete prefix failed: ${response.status}`);
  }

  const data = await response.json().catch(() => ({ deleted: 0 }));
  return typeof data.deleted === 'number' ? data.deleted : 0;
}

/**
 * Deleta múltiplas variantes de imagem (original, thumbnail, micro).
 * Remove URLs vazias/nulas e duplicadas antes de apagar.
 * Lança erro se qualquer uma falhar (exceto 404, tolerado em deleteFile).
 */
export async function deleteImageVariants(urls: Array<string | null | undefined>): Promise<void> {
  const targets: Array<{ bucket: string; path: string }> = [];
  const seen = new Set<string>();

  for (const url of urls) {
    if (!url || typeof url !== 'string' || !url.trim()) continue;
    const parsed = parseStorageUrl(url);
    if (!parsed) continue;

    const key = `${parsed.bucket}/${parsed.path}`;
    if (!seen.has(key)) {
      seen.add(key);
      targets.push(parsed);
    }
  }

  if (targets.length === 0) return;

  const results = await Promise.allSettled(
    targets.map((t) => deleteFile(t.bucket, t.path))
  );

  const firstRejected = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (firstRejected) {
    throw firstRejected.reason instanceof Error
      ? firstRejected.reason
      : new Error(String(firstRejected.reason));
  }
}

/**
 * Remove variantes antigas de imagem após substituição, exceto aquelas
 * cujo caminho (bucket/path) coincide com alguma das novas URLs.
 * Ignora valores vazios/nulos.
 */
export async function replaceImageCleanup(
  oldUrls: Array<string | null | undefined>,
  newUrls: Array<string | null | undefined>
): Promise<void> {
  const newKeys = new Set<string>();
  for (const url of newUrls) {
    if (!url || typeof url !== 'string' || !url.trim()) continue;
    const parsed = parseStorageUrl(url);
    if (parsed) {
      newKeys.add(`${parsed.bucket}/${parsed.path}`);
    } else {
      newKeys.add(url.trim());
    }
  }

  const urlsToDelete: string[] = [];
  for (const url of oldUrls) {
    if (!url || typeof url !== 'string' || !url.trim()) continue;
    const parsed = parseStorageUrl(url);
    const key = parsed ? `${parsed.bucket}/${parsed.path}` : url.trim();
    if (!newKeys.has(key)) {
      urlsToDelete.push(url);
    }
  }

  if (urlsToDelete.length === 0) return;
  await deleteImageVariants(urlsToDelete);
}

export type StorageListItem =
  | { name: string; path: string; type: 'dir'; file_count: number }
  | { name: string; path: string; type: 'file'; size: number; modified: string };

export interface ListFilesResult {
  items: StorageListItem[];
  truncated: boolean;
}

/**
 * Lista itens (pastas e arquivos) de um bucket no storage self-hosted.
 * Normaliza o prefix removendo barras no início e no fim.
 */
export async function listFiles(bucket: string, prefix: string): Promise<ListFilesResult> {
  const token = await getAccessToken();
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, '');

  const response = await fetch(`${UPLOAD_API_URL}/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ bucket, prefix: cleanPrefix }),
  });

  if (response.status === 401) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    throw new Error(errObj.error || `List failed: ${response.status}`);
  }

  const data = await response.json().catch(() => ({ items: [], truncated: false }));
  return {
    items: Array.isArray(data.items) ? data.items : [],
    truncated: Boolean(data.truncated),
  };
}


