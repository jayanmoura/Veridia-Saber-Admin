import { useEffect, useState } from 'react';
import { X, Smartphone, Zap, Download } from 'lucide-react';

export function InstallPWA() {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            console.log("PWA Install Triggered");
            setSupportsPWA(true);
            setPromptInstall(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!promptInstall) return;

        setIsInstalling(true);

        try {
            await promptInstall.prompt();
            const { outcome } = await promptInstall.userChoice;

            if (outcome === 'accepted') {
                setSupportsPWA(false);
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error during installation:', error);
        } finally {
            setIsInstalling(false);
        }
    };

    if (!supportsPWA) {
        return null;
    }

    return (
        <>
            {/* Install Button */}
            <button
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-emerald-500/25 hover:scale-105 z-50"
                id="setup_button"
                aria-label="Instalar App"
                onClick={() => setShowModal(true)}
            >
                <Download size={18} className="animate-bounce" />
                <span className="hidden sm:inline font-semibold">Instalar App</span>
            </button>

            {/* Custom Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-700/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with gradient background */}
                        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8 text-center">
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
                            >
                                <X size={18} />
                            </button>

                            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                                <img
                                    src="/icon.png"
                                    alt="Veridia"
                                    className="w-14 h-14 rounded-lg"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">
                                Instalar Veridia Admin
                            </h2>
                            <p className="text-emerald-100 text-sm">
                                Tenha acesso rápido ao painel administrativo
                            </p>
                        </div>

                        {/* Benefits */}
                        <div className="px-6 py-6 space-y-4">
                            <p className="text-slate-300 text-sm text-center mb-4">
                                Instale o app para uma experiência ainda melhor:
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-slate-200">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <Zap className="text-emerald-400" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Acesso Instantâneo</p>
                                        <p className="text-xs text-slate-400">Abra direto da sua área de trabalho</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-slate-200">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                        <Smartphone className="text-blue-400" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Experiência Nativa</p>
                                        <p className="text-xs text-slate-400">Interface limpa, sem barra do navegador</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-slate-200">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <Zap className="text-purple-400" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Atualizações Automáticas</p>
                                        <p className="text-xs text-slate-400">Sempre na versão mais recente</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-3 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Agora não
                            </button>
                            <button
                                onClick={handleInstallClick}
                                disabled={isInstalling}
                                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isInstalling ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Instalando...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Instalar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
