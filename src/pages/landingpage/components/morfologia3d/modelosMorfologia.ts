export interface ParteModelo {
  id: string;
  rotulo: string;
  descricao: string;
  nos: string[];
  prefixos?: string[];
  deslocamentoHotspot?: [number, number, number];
}

export interface ModeloOrgao {
  url: string;
  titulo: string;
  topicoRelacionado: string;
  partes: ParteModelo[];
  naoSelecionaveis: string[];
}

export const MODELOS_MORFOLOGIA: Record<string, ModeloOrgao> = {
  Raiz: {
    url: '/modelos3d/raiz.glb',
    titulo: 'Raiz de eudicotiledônea',
    topicoRelacionado: 'Definição de Raiz e Suas Partes',
    naoSelecionaveis: ['solo_aderido'],
    partes: [
      {
        id: 'coifa',
        rotulo: 'Coifa',
        nos: ['coifa'],
        deslocamentoHotspot: [0, -0.08, 0],
        descricao:
          'Capa de células que recobre e protege o meristema da ponta da raiz enquanto ela avança no solo. Suas células se desgastam e são repostas continuamente, e ela participa da percepção da gravidade (geotropismo positivo).'
      },
      {
        id: 'zona_lisa',
        rotulo: 'Zona lisa',
        nos: ['zona_lisa'],
        deslocamentoHotspot: [-0.10, 0, 0],
        descricao:
          'Também chamada zona de alongamento. Fica logo acima da ponta: ali as células recém-formadas se alongam e empurram a raiz para frente. É lisa porque ainda não tem pelos.'
      },
      {
        id: 'zona_pilifera',
        rotulo: 'Zona pilífera',
        nos: ['zona_pilifera', 'pelos_absorventes'],
        deslocamentoHotspot: [0.16, 0, 0],
        descricao:
          'Região dos pelos absorventes, prolongamentos das células da epiderme que aumentam muito a superfície de contato com o solo. É a principal zona de absorção de água e sais minerais.'
      },
      {
        id: 'zona_ramificacao',
        rotulo: 'Zona de ramificação',
        nos: ['zona_ramificacao', 'primordios_laterais'],
        descricao:
          'Parte mais velha da raiz, onde os pelos já caíram. Daqui nascem as raízes laterais, de dentro para fora; as mais novas ficam mais perto da ponta.'
      },
      {
        id: 'laterais',
        rotulo: 'Raízes secundárias e terciárias',
        nos: ['pelos_absorventes_laterais'],
        prefixos: ['raiz_secundaria_', 'raiz_terciaria_'],
        descricao:
          'As secundárias nascem da raiz primária e delas saem as terciárias. Cada uma repete as mesmas zonas da ponta. Junto da raiz primária, formam o sistema pivotante (axial), típico das eudicotiledôneas.'
      },
      {
        id: 'coleto',
        rotulo: 'Coleto',
        nos: ['coleto'],
        descricao: 'Região de transição entre a raiz e o caule.'
      }
    ]
  }
};

export function getModeloOrgao(orgao: string): ModeloOrgao | null {
  if (!orgao) return null;
  return MODELOS_MORFOLOGIA[orgao] ?? null;
}

export function parteDoNo(modelo: ModeloOrgao, nomeDoNo: string): ParteModelo | null {
  if (modelo.naoSelecionaveis.includes(nomeDoNo)) {
    return null;
  }

  for (const parte of modelo.partes) {
    if (parte.nos.includes(nomeDoNo)) {
      return parte;
    }
    if (parte.prefixos?.some((prefixo) => nomeDoNo.startsWith(prefixo))) {
      return parte;
    }
  }

  return null;
}

export function normalizarTitulo(t: string): string {
  return t
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
