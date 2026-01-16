import { GlobalHeatmap } from '../../components/Maps/GlobalHeatmap';

export default function GlobalMapPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Mapa Global de Coletas</h1>
                <p className="text-gray-500">Visualização de todas as plantas catalogadas no mundo.</p>
            </div>

            <GlobalHeatmap />
        </div>
    );
}
