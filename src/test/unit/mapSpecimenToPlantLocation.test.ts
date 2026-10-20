import { describe, it, expect } from 'vitest';
import { mapSpecimenToPlantLocation, type RawPlantRow } from '../../utils/mapSpecimenToPlantLocation';

describe('mapSpecimenToPlantLocation', () => {
  const baseRow: RawPlantRow = {
    id: 42,
    latitude: -22.76,
    longitude: -43.68,
    local_id: 7,
    tombo_codigo: 'UFRRJ-0042',
    coletor: 'Coletor Campo',
    created_at: '2026-10-18T14:30:00Z',
    created_by: 'user-abc',
    imagens: [
      {
        url_micro: 'https://cdn.example.com/specimen-micro.webp',
        url_thumbnail: 'https://cdn.example.com/specimen-thumb.webp',
        url_imagem: 'https://cdn.example.com/specimen-full.jpg',
      },
    ],
    especie: {
      nome_cientifico: 'Euphorbia milii',
      nome_popular: 'Coroa-de-cristo, Dois-amigos',
      familia: { familia_nome: 'Euphorbiaceae' },
      imagens: [
        {
          url_micro: 'https://cdn.example.com/species-micro.webp',
          url_thumbnail: 'https://cdn.example.com/species-thumb.webp',
          url_imagem: 'https://cdn.example.com/species-full.jpg',
        },
      ],
    },
    locais: {
      nome: 'Jardim Botânico UFRRJ',
      latitude: -22.75,
      longitude: -43.67,
    },
  };

  it('usa foto Tipo B do espécime primeiro quando ambos espécime e espécie possuem fotos', () => {
    const result = mapSpecimenToPlantLocation(baseRow);

    expect(result.image).toBe('https://cdn.example.com/specimen-micro.webp');
  });

  it('faz fallback para foto Tipo A da espécie quando o espécime não possui fotos', () => {
    const rowWithoutSpecimenImages: RawPlantRow = {
      ...baseRow,
      imagens: [],
    };

    const result = mapSpecimenToPlantLocation(rowWithoutSpecimenImages);

    expect(result.image).toBe('https://cdn.example.com/species-micro.webp');
  });

  it('preenche os campos novos (tombo, nome_popular, coletor, created_at, created_by e cadastrado_por)', () => {
    const profileNames = new Map<string, string>([['user-abc', 'Dra. Helena Botânica']]);

    const result = mapSpecimenToPlantLocation(baseRow, profileNames);

    expect(result.id).toBe(42);
    expect(result.species_name).toBe('Euphorbia milii');
    expect(result.family_name).toBe('Euphorbiaceae');
    expect(result.project_id).toBe(7);
    expect(result.project_name).toBe('Jardim Botânico UFRRJ');
    expect(result.tombo).toBe('UFRRJ-0042');
    expect(result.nome_popular).toBe('Coroa-de-cristo, Dois-amigos');
    expect(result.coletor).toBe('Coletor Campo');
    expect(result.created_at).toBe('2026-10-18T14:30:00Z');
    expect(result.created_by).toBe('user-abc');
    expect(result.cadastrado_por).toBe('Dra. Helena Botânica');
  });

  it('usa coletor como fallback para cadastrado_por quando created_by não está no mapa de perfis', () => {
    const result = mapSpecimenToPlantLocation(baseRow, new Map());

    expect(result.cadastrado_por).toBe('Coletor Campo');
  });
});
