import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ArrowLeft,
  X,
  FileText,
  Download,
  Loader2,
  Calendar,
} from 'lucide-react';
import { usePeriodicReports } from '../../hooks';
import { generatePeriodicActivityReport } from '../../utils/pdf';
import { useToast } from '../../hooks/useToast';
import type { PeriodicReport, PeriodicReportType } from '../../types/domain';

interface PeriodicReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FixedFolder {
  type: PeriodicReportType;
  title: string;
  description: string;
}

const FIXED_FOLDERS: FixedFolder[] = [
  { type: 'mensal', title: 'Mês', description: 'Relatórios mensais de atividade' },
  { type: 'bimestral', title: 'Bimestral', description: 'Relatórios bimestrais de atividade' },
  { type: 'semestral', title: 'Semestre', description: 'Relatórios semestrais de atividade' },
  { type: 'anual', title: 'Ano', description: 'Relatórios anuais consolidados' },
];

/**
 * Modal com navegação em 3 níveis de pastas para visualização e download
 * de relatórios periódicos de atividade (tabela relatorios_periodicos).
 */
export function PeriodicReportsModal({ isOpen, onClose }: PeriodicReportsModalProps) {
  const { showToast } = useToast();
  const { reports, years, loading, error } = usePeriodicReports({ enabled: isOpen });

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<PeriodicReportType | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);

  const handleClose = () => {
    setSelectedYear(null);
    setSelectedType(null);
    onClose();
  };

  const handleDownloadPDF = async (report: PeriodicReport, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setDownloadingId(report.id);
      generatePeriodicActivityReport(report);
      showToast(`Relatório "${report.periodo_label}" baixado com sucesso!`, 'success');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      showToast('Erro ao gerar relatório em PDF.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // Relatórios filtrados para o nível 3 (ano e tipo selecionados)
  const currentReports = useMemo(() => {
    if (selectedYear === null || selectedType === null) return [];
    return reports
      .filter((r) => r.ano === selectedYear && r.tipo === selectedType)
      .sort((a, b) => a.periodo_inicio.localeCompare(b.periodo_inicio));
  }, [reports, selectedYear, selectedType]);

  const currentFolderInfo = useMemo(() => {
    if (!selectedType) return null;
    return FIXED_FOLDERS.find((f) => f.type === selectedType) || null;
  }, [selectedType]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal Card — altura e largura fixas constantes com scroll interno */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[600px] max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up border border-gray-100">
        {/* Header com Breadcrumb — fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3">
            {selectedType !== null ? (
              <button
                onClick={() => setSelectedType(null)}
                className="p-1.5 hover:bg-gray-200/70 rounded-lg transition-colors text-gray-600"
                title="Voltar para tipos de relatório"
              >
                <ArrowLeft size={18} />
              </button>
            ) : selectedYear !== null ? (
              <button
                onClick={() => setSelectedYear(null)}
                className="p-1.5 hover:bg-gray-200/70 rounded-lg transition-colors text-gray-600"
                title="Voltar para anos"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <Folder size={20} />
              </div>
            )}

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => {
                  setSelectedYear(null);
                  setSelectedType(null);
                }}
                className={`transition-colors font-medium ${
                  selectedYear === null
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Relatórios Periódicos
              </button>

              {selectedYear !== null && (
                <>
                  <ChevronRight size={14} className="text-gray-400" />
                  <button
                    onClick={() => setSelectedType(null)}
                    className={`transition-colors font-medium ${
                      selectedType === null
                        ? 'text-gray-900 font-semibold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {selectedYear}
                  </button>
                </>
              )}

              {selectedType !== null && (
                <>
                  <ChevronRight size={14} className="text-gray-400" />
                  <span className="text-gray-900 font-semibold">
                    {currentFolderInfo?.title}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content — área rolável com tamanho contido */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="animate-spin text-emerald-600 mb-3" size={32} />
              <p className="text-sm">Carregando relatórios...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-3 bg-red-50 text-red-600 rounded-full mb-3">
                <X size={24} />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Erro ao carregar</h3>
              <p className="text-sm text-gray-500 max-w-md">{error}</p>
            </div>
          ) : selectedYear === null ? (
            /* ================= NÍVEL 1: LISTA DE ANOS ================= */
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Selecione o Ano
                </h3>
                <p className="text-xs text-gray-500">
                  Pastas organizadas por ano de atividade registrada
                </p>
              </div>

              {years.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-xl">
                  <FolderOpen size={40} className="text-gray-300 mb-3" />
                  <h4 className="text-base font-medium text-gray-700 mb-1">
                    Nenhum relatório encontrado
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Ainda não há registros de relatórios periódicos de atividade gerados no sistema.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {years.map((year) => {
                    const yearCount = reports.filter((r) => r.ano === year).length;
                    return (
                      <div
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className="group p-5 bg-white border border-gray-200 hover:border-amber-400 hover:shadow-md rounded-xl cursor-pointer transition-all flex flex-col items-center text-center"
                      >
                        <div className="p-3.5 bg-amber-50 group-hover:bg-amber-100/80 rounded-2xl text-amber-500 transition-colors mb-3">
                          <Folder size={36} />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
                          {year}
                        </h4>
                        <span className="text-xs text-gray-500 mt-1">
                          {yearCount} {yearCount === 1 ? 'relatório' : 'relatórios'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : selectedType === null ? (
            /* ================= NÍVEL 2: 4 PASTAS FIXAS DENTRO DO ANO ================= */
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Periodicidade — {selectedYear}
                </h3>
                <p className="text-xs text-gray-500">
                  Selecione o intervalo de consolidação dos relatórios
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {FIXED_FOLDERS.map((folder) => {
                  const count = reports.filter(
                    (r) => r.ano === selectedYear && r.tipo === folder.type
                  ).length;

                  return (
                    <div
                      key={folder.type}
                      onClick={() => setSelectedType(folder.type)}
                      className="group p-5 bg-white border border-gray-200 hover:border-indigo-400 hover:shadow-md rounded-xl cursor-pointer transition-all flex flex-col items-center text-center"
                    >
                      <div className="p-3.5 bg-indigo-50 group-hover:bg-indigo-100/80 rounded-2xl text-indigo-600 transition-colors mb-3">
                        <Folder size={36} />
                      </div>
                      <h4 className="text-base font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {folder.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{folder.description}</p>
                      <span
                        className={`text-xs mt-2 px-2 py-0.5 rounded-full font-medium ${
                          count > 0
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {count} {count === 1 ? 'relatório' : 'relatórios'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ================= NÍVEL 3: RELATÓRIOS DO TIPO E ANO ================= */
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    {currentFolderInfo?.title} — {selectedYear}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Clique em um relatório para gerar e baixar a ficha técnica em PDF
                  </p>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {currentReports.length} {currentReports.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {currentReports.length === 0 ? (
                /* Pasta vazia: mensagem explícita conforme especificado */
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <div className="p-3 bg-gray-100 rounded-full text-gray-400 mb-3">
                    <FolderOpen size={32} />
                  </div>
                  <h4 className="text-base font-medium text-gray-700 mb-1">
                    Nenhum relatório gerado ainda
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Ainda não existem relatórios da periodicidade "{currentFolderInfo?.title}" para o ano de {selectedYear}.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentReports.map((report) => {
                    const isDownloading = downloadingId === report.id;
                    const totalOps = report.dados?.total ?? 0;

                    return (
                      <div
                        key={report.id}
                        onClick={() => handleDownloadPDF(report)}
                        className="p-4 bg-white border border-gray-200 hover:border-emerald-400 hover:shadow-md rounded-xl cursor-pointer transition-all flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl group-hover:bg-emerald-100 transition-colors shrink-0">
                            <FileText size={22} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors truncate">
                              {report.periodo_label}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar size={13} className="text-gray-400" />
                                {formatDate(report.periodo_inicio)} a {formatDate(report.periodo_fim)}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700">
                                {totalOps} {totalOps === 1 ? 'operação' : 'operações'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDownloadPDF(report, e)}
                          disabled={isDownloading}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg text-xs font-semibold transition-all border border-emerald-200 hover:border-transparent shrink-0 shadow-2xs disabled:opacity-50"
                          title="Baixar PDF"
                        >
                          {isDownloading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                          <span>PDF</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer — fixo na base */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>Sistema Veridia Saber — Relatórios Periódicos de Auditoria</span>
          <button
            onClick={handleClose}
            className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
