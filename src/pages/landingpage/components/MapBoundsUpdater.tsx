import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface Props {
  pontos: Array<{ latitude: number; longitude: number }>;
}

export function MapBoundsUpdater({ pontos }: Props) {
  const map = useMap();

  useEffect(() => {
    if (pontos.length === 0) return;
    if (pontos.length === 1) {
      map.setView([pontos[0].latitude, pontos[0].longitude], 16);
      return;
    }
    const bounds = pontos.map(p => [p.latitude, p.longitude] as [number, number]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
  }, [pontos, map]);

  return null;
}
