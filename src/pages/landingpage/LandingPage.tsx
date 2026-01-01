import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    WifiOff,
    Cloud,
    MapPin,
    ExternalLink,
    X,
    Mail,
    Download,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import logoIcon from '/icon.png';

// ============ BETA DOWNLOAD MODAL ============
interface BetaDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function BetaDownloadModal({ isOpen, onClose }: BetaDownloadModalProps) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            // Check if email exists in beta_testers table
            const { data, error } = await supabase
                .from('beta_testers')
                .select('id, email')
                .eq('email', email.toLowerCase().trim())
                .eq('is_active', true)
                .single();

            if (error || !data) {
                setStatus('error');
                setErrorMessage('Este email não está cadastrado no programa beta. Entre em contato para solicitar acesso.');
                return;
            }

            // Delete email after successful verification (one-time use)
            await supabase
                .from('beta_testers')
                .delete()
                .eq('id', data.id);

            setStatus('success');

            // Trigger download after short delay
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = '/downloads/Beta-Teste-VeridiaSaber.apk';
                link.download = 'Beta-Teste-VeridiaSaber.apk';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, 1000);

        } catch {
            setStatus('error');
            setErrorMessage('Erro ao verificar email. Tente novamente.');
        }
    };

    const handleClose = () => {
        setEmail('');
        setStatus('idle');
        setErrorMessage('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                {status === 'success' ? (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-emerald-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Download Liberado!</h3>
                        <p className="text-gray-600">O download do APK vai começar automaticamente...</p>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Download className="text-emerald-600" size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Download Beta</h3>
                            <p className="text-gray-600 text-sm">
                                O Veridia Saber está em fase beta. Digite seu email cadastrado para baixar.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email cadastrado
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        required
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {status === 'error' && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                                    <p className="text-red-700 text-sm">{errorMessage}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading' || !email}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Verificando...
                                    </>
                                ) : (
                                    <>
                                        <Download size={20} />
                                        Baixar APK
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-center text-xs text-gray-500 mt-4">
                            Não tem acesso?{' '}
                            <a href="mailto:jayanmoura@gmail.com" className="text-emerald-600 hover:underline">
                                Solicite aqui
                            </a>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

// ============ HERO SECTION ============
function HeroSection({ onOpenDownloadModal }: { onOpenDownloadModal: () => void }) {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#1a472a] via-[#234d32] to-[#1a3a24]">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 to-emerald-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-6 py-20 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Content */}
                    <div className="text-white space-y-8 animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                            <img src={logoIcon} alt="Veridia Saber" className="w-5 h-5" />
                            <span className="text-sm font-medium text-emerald-100">Enciclopédia Botânica</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                            <span className="text-white">Veridia Saber:</span>
                            <br />
                            <span className="bg-gradient-to-r from-emerald-300 to-purple-300 bg-clip-text text-transparent">
                                Sua enciclopédia botânica de bolso.
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-emerald-100/80 max-w-xl leading-relaxed">
                            Identifique espécies, organize coleções e gerencie projetos de campo.{' '}
                            <span className="font-semibold text-white">Disponível offline quando você precisar.</span>
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={onOpenDownloadModal}
                                className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-900/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                            >
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.523 0c.987.02 1.967.172 2.911.492a9.038 9.038 0 0 1 2.556 1.403l-6.986 8.11 6.986 8.106a9.049 9.049 0 0 1-2.556 1.407 9.13 9.13 0 0 1-2.911.492c-.18 0-.361-.01-.541-.02l-5.975-9.985L17.02.02c.18-.01.361-.02.541-.02zm-5.975 10.005L5.558.02C5.378.01 5.197 0 5.017 0a9.13 9.13 0 0 0-2.911.492A9.038 9.038 0 0 0 .55 1.895l6.986 8.11L.55 18.111a9.049 9.049 0 0 0 2.556 1.407 9.13 9.13 0 0 0 2.911.492c.18 0 .361-.01.541-.02l5.99-9.985z" />
                                </svg>
                                <span>Baixar para Android</span>
                                <Download size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <button
                                disabled
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-white/10 text-white/60 font-medium rounded-2xl border border-white/20 cursor-not-allowed"
                            >
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                <span>Versão iOS em breve</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Phone Mockup */}
                    <div className="flex justify-center lg:justify-end animate-float">
                        <div className="relative">
                            {/* Phone frame */}
                            <div className="relative w-[280px] md:w-[320px] h-[580px] md:h-[640px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-black/50 border-4 border-gray-800">
                                {/* Screen */}
                                <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative">
                                    {/* Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-10"></div>

                                    {/* Real app screenshot */}
                                    <img
                                        src="/Tela Inicial.png"
                                        alt="Tela inicial do Veridia Saber"
                                        className="w-full h-full object-cover object-top"
                                    />
                                </div>
                            </div>

                            {/* Decorative glow */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-emerald-500/20 blur-3xl rounded-full -z-10"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
                <span className="text-white/50 text-sm">Saiba mais</span>
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse"></div>
                </div>
            </div>
        </section>
    );
}

// ============ FEATURES SECTION ============
function FeaturesSection() {
    const features = [
        {
            icon: WifiOff,
            title: 'Coleções Offline',
            description: 'Catalogue plantas no seu dispositivo e acesse seus dados mesmo sem internet.',
            color: 'emerald',
            gradient: 'from-emerald-500 to-teal-600'
        },
        {
            icon: MapPin,
            title: 'Mapas Baixáveis',
            description: 'Baixe locais com mapas e todas as plantas para explorar em áreas sem sinal.',
            color: 'purple',
            gradient: 'from-purple-500 to-violet-600'
        },
        {
            icon: Cloud,
            title: 'Sincronização Segura',
            description: 'Seus dados salvos no dispositivo e na nuvem automaticamente.',
            color: 'blue',
            gradient: 'from-blue-500 to-cyan-600'
        }
    ];

    return (
        <section id="diferenciais" className="py-24 bg-white">
            <div className="container mx-auto px-6">
                {/* Section header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
                        Diferenciais
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Por que escolher o Veridia Saber?
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                        Desenvolvido pensando nas necessidades reais de pesquisadores e entusiastas da botânica.
                    </p>
                </div>

                {/* Features grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative bg-gray-50 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 border border-gray-100 hover:border-gray-200 hover:-translate-y-2"
                        >
                            {/* Icon */}
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                <feature.icon size={28} className="text-white" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Decorative corner */}
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-tr-3xl transition-opacity duration-500`}></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============ ABOUT SECTION ============
function AboutSection() {
    const [speciesCount, setSpeciesCount] = useState<number | null>(null);

    // Fetch real species count from Supabase
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { count } = await supabase
                    .from('especie')
                    .select('*', { count: 'exact', head: true });

                if (count !== null) {
                    setSpeciesCount(count);
                }
            } catch (error) {
                console.error('Error fetching species count:', error);
            }
        };
        fetchStats();
    }, []);

    return (
        <section id="sobre" className="py-24 bg-gradient-to-b from-emerald-50 to-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-200 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-100 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Logo */}
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-white/90 rounded-3xl mb-8 shadow-xl shadow-emerald-200 p-2">
                        <img src={logoIcon} alt="Veridia Saber" className="w-full h-full object-contain" />
                    </div>

                    {/* Content */}
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                        Sobre o Projeto
                    </h2>

                    {/* Slogan */}
                    <blockquote className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8 italic font-medium">
                        "O Veridia Saber é uma ponte, uma ponte que liga o entusiasta ao cientista, o curioso ao pesquisador e, todos nós, a biodiversidade incrível que nos rodeia. A tecnologia serve ao conhecimento e a natureza!"
                    </blockquote>

                    <p className="text-lg text-gray-600 leading-relaxed mb-8">
                        Desenvolvido para auxiliar no estudo e catalogação da biodiversidade brasileira,
                        o aplicativo permite identificar espécies, registrar ocorrências georreferenciadas e
                        manter coleções organizadas de forma profissional — mesmo em áreas sem conexão.
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 mt-12">
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">
                                {speciesCount !== null ? speciesCount.toLocaleString('pt-BR') : '...'}
                            </div>
                            <div className="text-gray-500 text-sm">Espécies Catalogadas</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">Offline</div>
                            <div className="text-gray-500 text-sm">Coleções e Mapas</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">Sync</div>
                            <div className="text-gray-500 text-sm">Automática</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ============ FOOTER ============
function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-12">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1">
                            <img src={logoIcon} alt="Veridia Saber" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xl font-bold">Veridia Saber</span>
                    </div>

                    {/* Links */}
                    <nav className="flex flex-wrap justify-center gap-6 text-sm">
                        <Link to="/politica" className="text-gray-400 hover:text-white transition-colors">
                            Política de Privacidade
                        </Link>
                        <Link to="/termos" className="text-gray-400 hover:text-white transition-colors">
                            Termos de Uso
                        </Link>
                        <a
                            href="https://painel-admin.veridiasaber.com.br"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                        >
                            Acessar Painel Admin
                            <ExternalLink size={14} />
                        </a>
                    </nav>

                    {/* Copyright */}
                    <div className="text-gray-500 text-sm">
                        © 2026 Veridia Saber. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ============ MAIN LANDING PAGE ============
export default function LandingPage() {
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

    return (
        <main className="min-h-screen">
            <HeroSection onOpenDownloadModal={() => setIsDownloadModalOpen(true)} />
            <FeaturesSection />
            <AboutSection />
            <Footer />

            <BetaDownloadModal
                isOpen={isDownloadModalOpen}
                onClose={() => setIsDownloadModalOpen(false)}
            />
        </main>
    );
}
