import L from 'leaflet';

/**
 * Ícones compartilhados para os mapas Leaflet do site público.
 * Usado por FamiliesSection, DetalhesFamilia, DetalhesEspecie e DetalhesLocal
 * para manter o mesmo estilo de "bolinha" em vez do pino padrão do Leaflet,
 * e para desenhar os balões de cluster (agrupamento) quando muitos pontos
 * estão próximos no mesmo nível de zoom.
 */

export const SPECIMEN_DOT_COLOR = '#4a7c5a';

const dotIconCache = new Map<string, L.DivIcon>();

/**
 * Bolinha pequena (14px) usada para cada espécime individual no mapa.
 * Substitui o pino padrão do Leaflet — fica centrada exatamente na
 * coordenada e é pequena o suficiente para não tampar pontos vizinhos.
 */
export function createDotIcon(color: string = SPECIMEN_DOT_COLOR): L.DivIcon {
  const cached = dotIconCache.get(color);
  if (cached) return cached;

  const icon = L.divIcon({
    className: 'veridia-dot-marker',
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.35);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  });

  dotIconCache.set(color, icon);
  return icon;
}

/**
 * iconCreateFunction do react-leaflet-cluster: desenha o balão de cluster
 * com a contagem de espécimes agrupados. O tamanho/tom aumenta conforme
 * a quantidade de pontos no cluster, para dar uma noção visual de densidade.
 */
interface ClusterLike {
  getChildCount(): number;
}

export function createClusterIcon(cluster: ClusterLike): L.DivIcon {
  const count = cluster.getChildCount();

  let size = 32;
  let fontSize = 12;
  let background = '#5fcf6e';

  if (count >= 50) {
    size = 48;
    fontSize = 15;
    background = '#1a3a1f';
  } else if (count >= 10) {
    size = 40;
    fontSize = 13;
    background = '#4a7c5a';
  }

  return L.divIcon({
    className: 'veridia-cluster-marker',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${background};border:3px solid rgba(255,255,255,0.85);color:#ffffff;font-weight:700;font-size:${fontSize}px;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${count}</div>`,
    iconSize: L.point(size, size, true),
  });
}
