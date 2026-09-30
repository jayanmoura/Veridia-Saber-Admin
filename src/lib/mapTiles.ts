export type MapStyle = 'light' | 'dark' | 'satellite';

export interface BasemapConfig {
  url: string;
  attribution: string;
  className?: string;
  maxNativeZoom: number;
  maxZoom: number;
}

const rawKey = import.meta.env.VITE_MAPTILER_KEY;
const maptilerKey = typeof rawKey === 'string' && rawKey.trim() !== '' ? rawKey.trim() : null;

export function getBasemap(style: MapStyle): BasemapConfig {
  if (style === 'satellite') {
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri',
      maxNativeZoom: 19,
      maxZoom: 22,
    };
  }

  if (maptilerKey) {
    if (style === 'dark') {
      return {
        url: `https://api.maptiler.com/maps/streets-v2-dark/256/{z}/{x}/{y}.png?key=${maptilerKey}`,
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxNativeZoom: 19,
        maxZoom: 22,
      };
    }

    return {
      url: `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${maptilerKey}`,
      attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxNativeZoom: 19,
      maxZoom: 22,
    };
  }

  const osmUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  if (style === 'dark') {
    return {
      url: osmUrl,
      attribution: osmAttribution,
      className: 'map-tiles-dark-fallback',
      maxNativeZoom: 19,
      maxZoom: 22,
    };
  }

  return {
    url: osmUrl,
    attribution: osmAttribution,
    maxNativeZoom: 19,
    maxZoom: 22,
  };
}
