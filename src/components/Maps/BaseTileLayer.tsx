import { TileLayer } from 'react-leaflet';
import { getBasemap, type MapStyle } from '../../lib/mapTiles';

interface BaseTileLayerProps {
  style?: MapStyle;
}

export function BaseTileLayer({ style = 'light' }: BaseTileLayerProps) {
  const basemap = getBasemap(style);

  return (
    <TileLayer
      key={style}
      url={basemap.url}
      attribution={basemap.attribution}
      className={basemap.className}
      maxNativeZoom={basemap.maxNativeZoom}
      maxZoom={basemap.maxZoom}
    />
  );
}
