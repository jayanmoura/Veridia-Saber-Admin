import { describe, it, expect } from 'vitest';
import { pickSpeciesThumbnail } from '../../utils/speciesThumbnail';

describe('pickSpeciesThumbnail', () => {
  it('retorna a miniatura de Tipo B quando há apenas Tipo B', () => {
    const result = pickSpeciesThumbnail({
      specimenImages: [
        {
          url_micro: 'https://cdn.example.com/specimen_micro.jpg',
          url_thumbnail: 'https://cdn.example.com/specimen_thumb.jpg',
          url_imagem: 'https://cdn.example.com/specimen_full.jpg',
        },
      ],
      speciesImages: [],
    });

    expect(result).toEqual({
      thumb: 'https://cdn.example.com/specimen_micro.jpg',
      full: 'https://cdn.example.com/specimen_full.jpg',
    });
  });

  it('retorna a miniatura de Tipo A quando há apenas Tipo A', () => {
    const result = pickSpeciesThumbnail({
      specimenImages: [],
      speciesImages: [
        {
          url_thumbnail: 'https://cdn.example.com/species_thumb.jpg',
          url_imagem: 'https://cdn.example.com/species_full.jpg',
        },
      ],
    });

    expect(result).toEqual({
      thumb: 'https://cdn.example.com/species_thumb.jpg',
      full: 'https://cdn.example.com/species_full.jpg',
    });
  });

  it('prioriza Tipo B quando ambos estão presentes (B vence)', () => {
    const result = pickSpeciesThumbnail({
      specimenImages: [
        {
          url_micro: 'https://cdn.example.com/specimen_micro.jpg',
          url_imagem: 'https://cdn.example.com/specimen_full.jpg',
        },
      ],
      speciesImages: [
        {
          url_thumbnail: 'https://cdn.example.com/species_thumb.jpg',
          url_imagem: 'https://cdn.example.com/species_full.jpg',
        },
      ],
    });

    expect(result).toEqual({
      thumb: 'https://cdn.example.com/specimen_micro.jpg',
      full: 'https://cdn.example.com/specimen_full.jpg',
    });
  });

  it('retorna null quando nenhum dos dois está presente ou ambos são vazios', () => {
    expect(pickSpeciesThumbnail({})).toBeNull();
    expect(pickSpeciesThumbnail({ specimenImages: [], speciesImages: [] })).toBeNull();
    expect(pickSpeciesThumbnail({ specimenImages: null, speciesImages: null })).toBeNull();
  });

  it('ignora imagens sem URL válida e avança para a próxima candidata válida', () => {
    const result = pickSpeciesThumbnail({
      specimenImages: [
        { url_imagem: null, url_thumbnail: null, url_micro: null },
        { url_imagem: '', url_thumbnail: '   ', url_micro: '' },
        {
          url_thumbnail: 'https://cdn.example.com/valid_specimen_thumb.jpg',
          url_imagem: 'https://cdn.example.com/valid_specimen_full.jpg',
        },
      ],
      speciesImages: [
        {
          url_imagem: 'https://cdn.example.com/species_full.jpg',
        },
      ],
    });

    expect(result).toEqual({
      thumb: 'https://cdn.example.com/valid_specimen_thumb.jpg',
      full: 'https://cdn.example.com/valid_specimen_full.jpg',
    });
  });

  it('cai para Tipo A se todas as imagens de Tipo B forem inválidas ou sem URL', () => {
    const result = pickSpeciesThumbnail({
      specimenImages: [
        { url_imagem: null, url_thumbnail: null, url_micro: null },
        { url_imagem: '', url_thumbnail: undefined },
      ],
      speciesImages: [
        {
          url_micro: null,
          url_thumbnail: null,
          url_imagem: 'https://cdn.example.com/species_full.jpg',
        },
      ],
    });

    expect(result).toEqual({
      thumb: 'https://cdn.example.com/species_full.jpg',
      full: 'https://cdn.example.com/species_full.jpg',
    });
  });

  it('retorna null se todas as imagens de Tipo B e Tipo A forem vazias ou inválidas', () => {
    const result = pickSpeciesThumbnail({
      specimenImages: [
        { url_imagem: null, url_thumbnail: null, url_micro: null },
      ],
      speciesImages: [
        { url_imagem: '', url_thumbnail: '   ' },
      ],
    });

    expect(result).toBeNull();
  });
});
