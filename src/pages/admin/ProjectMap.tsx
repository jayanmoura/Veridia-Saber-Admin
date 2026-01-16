import { ProjectMapViz } from '../../components/Maps/ProjectMapViz';

export default function ProjectMap() {
    return (
        <div className="p-6 space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Mapa dos Projetos</h1>
                <p className="text-gray-500">Visualização geográfica dos acervos oficiais do Veridia Saber.</p>
            </div>

            <ProjectMapViz />
        </div>
    );
}
