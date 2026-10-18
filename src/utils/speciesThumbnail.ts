import type { ImageUrls } from '../types/db';

export type ImageCandidate = ImageUrls;

export interface PickSpeciesThumbnailParams {
  specimenImages?: ImageCandidate[] | null;
  speciesImages?: ImageCandidate[] | null;
}

export interface SpeciesThumbnailResult {
  thumb: string;
  full: string;
}

/**
 * Seleciona a melhor miniatura e imagem cheia para uma espécie.
 *
 * Prioridade:
 * 1. Primeira foto de espécime com URL válida (Tipo B)
 * 2. Primeira foto da espécie com URL válida (Tipo A)
 * 3. null se nenhuma foto tiver URL
 *
 * URLs para miniatura (thumb): url_micro || url_thumbnail || url_imagem
 * URLs para imagem cheia (full): url_imagem || url_thumbnail || url_micro
 */
export function pickSpeciesThumbnail({
  specimenImages,
  speciesImages,
}: PickSpeciesThumbnailParams): SpeciesThumbnailResult | null {
  const extractUrls = (img?: ImageCandidate | null): SpeciesThumbnailResult | null => {
    if (!img) return null;
    const micro = typeof img.url_micro === 'string' ? img.url_micro.trim() : null;
    const thumbnail = typeof img.url_thumbnail === 'string' ? img.url_thumbnail.trim() : null;
    const imagem = typeof img.url_imagem === 'string' ? img.url_imagem.trim() : null;

    const thumb = micro || thumbnail || imagem;
    const full = imagem || thumbnail || micro;

    if (thumb && full) {
      return { thumb, full };
    }
    return null;
  };

  if (specimenImages && specimenImages.length > 0) {
    for (const candidate of specimenImages) {
      const result = extractUrls(candidate);
      if (result) return result;
    }
  }

  if (speciesImages && speciesImages.length > 0) {
    for (const candidate of speciesImages) {
      const result = extractUrls(candidate);
      if (result) return result;
    }
  }

  return null;
}
