import { HardDrive, Camera, Zap, Image, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import type { StorageAnalysis } from '../../hooks/useProjectDetails';

interface StorageAnalysisTabProps {
    analysis: StorageAnalysis | null;
    loading: boolean;
    onFetch: () => void;
}

function formatSize(mb: number): string {
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(0)} MB`;
}

function formatMonth(yearMonth: string): string {
    const [year, month] = yearMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    const label = date.toLocaleDateString('pt-BR', { month: 'short' });
    const shortYear = year.slice(2);
    return `${label.charAt(0).toUpperCase()}${label.slice(1, 3)}/${shortYear}`;
}

export function StorageAnalysisTab({ analysis, loading, onFetch }: StorageAnalysisTabProps) {
    // Empty state — loading is handled by the spinner below; this branch is never reached
    // because the tab auto-fetches on open. Kept as safety fallback.
    if (!analysis && !loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-emerald-600" />
            </div>
        );
    }

    const cards = analysis ? [
        {
            label: 'Total de Imagens',
            value: analysis.totalImages,
            icon: Camera,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
        },
        {
            label: 'Otimizadas (micro)',
            value: analysis.withMicro,
            icon: Zap,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
        },
        {
            label: 'Com Thumbnail',
            value: analysis.withThumbnail,
            icon: Image,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
        },
        {
            label: 'Apenas Original',
            value: analysis.withOriginalOnly,
            icon: AlertTriangle,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
        },
    ] : [];

    const maxCount = analysis
        ? Math.max(...analysis.byMonth.map(m => m.count), 1)
        : 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <HardDrive size={22} className="text-emerald-600" />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Análise de Storage</h3>
                        <p className="text-sm text-gray-500">Uso de imagens e estimativa de custo</p>
                    </div>
                </div>
                <button
                    onClick={onFetch}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Analisando...
                        </>
                    ) : (
                        <>
                            <RefreshCw size={16} />
                            Atualizar
                        </>
                    )}
                </button>
            </div>

            {loading && !analysis && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-emerald-600" />
                </div>
            )}

            {analysis && (
                <>
                    {/* Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {cards.map((card) => (
                            <div
                                key={card.label}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 relative"
                            >
                                <div className={`absolute top-4 right-4 p-2 rounded-lg ${card.iconBg}`}>
                                    <card.icon size={16} className={card.iconColor} />
                                </div>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                                <p className="text-sm text-gray-500 mt-1 pr-10">{card.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Estimated data warning */}
                    {analysis.estimatedCount > 0 && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                            ⚠️ {analysis.estimatedCount} imagem(ns) com tamanho estimado (uploads anteriores a esta feature). Novos uploads gravam o tamanho real.
                        </p>
                    )}

                    {/* Size */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Tamanho em Disco
                        </h4>
                        <div className="divide-y divide-gray-100">
                            {[
                                { label: 'Originais', value: analysis.estimatedSizeMB.original },
                                { label: 'Thumbnails', value: analysis.estimatedSizeMB.thumbnail },
                                { label: 'Micros', value: analysis.estimatedSizeMB.micro },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between py-2.5 text-sm">
                                    <span className="text-gray-600">{row.label}</span>
                                    <span className="text-gray-800">{formatSize(row.value)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between py-2.5 text-sm border-t-2 border-gray-200 mt-1">
                                <span className="font-bold text-gray-900">Total</span>
                                <span className="font-bold text-gray-900">
                                    {formatSize(analysis.estimatedSizeMB.total)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Monthly chart */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Uploads por Mês</h4>
                        {analysis.byMonth.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">
                                Nenhum dado de upload disponível ainda.
                            </p>
                        ) : (
                            <div className="flex items-end gap-2 h-32">
                                {analysis.byMonth.map(({ month, count }) => (
                                    <div
                                        key={month}
                                        className="flex-1 flex flex-col items-center gap-1 min-w-0"
                                    >
                                        <span className="text-xs text-gray-500 tabular-nums">{count}</span>
                                        <div
                                            className="w-full bg-emerald-500 rounded-t-md"
                                            style={{ height: `${(count / maxCount) * 100}%` }}
                                        />
                                        <span className="text-xs text-gray-400 truncate w-full text-center">
                                            {formatMonth(month)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </>
            )}
        </div>
    );
}
