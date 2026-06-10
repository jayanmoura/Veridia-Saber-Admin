/**
 * Utilitário de Storage Self-hosted
 * Substitui o Supabase Storage
 */

const STORAGE_URL = import.meta.env.VITE_STORAGE_URL;
const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL;
const UPLOAD_SECRET = import.meta.env.VITE_UPLOAD_SECRET;

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
            const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
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
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('path', path);

    const response = await fetch(`${UPLOAD_API_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${UPLOAD_SECRET}`
            // Nota: não definir Content-Type ao enviar FormData com fetch, o browser define automaticamente o boundary
        },
        body: formData
    });

    if (!response.ok) {
        const errObj = await response.json().catch(() => ({}));
        throw new Error(errObj.error || `Erro HTTP no upload: ${response.status}`);
    }

    const data = await response.json();
    return data.url;
}

/**
 * Deleta um arquivo do storage self-hosted.
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
    const response = await fetch(`${UPLOAD_API_URL}/upload`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${UPLOAD_SECRET}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bucket, path })
    });

    if (!response.ok && response.status !== 404) {
        const errObj = await response.json().catch(() => ({}));
        throw new Error(errObj.error || `Erro HTTP na exclusão: ${response.status}`);
    }
}
