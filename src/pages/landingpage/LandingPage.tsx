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
    Loader2,
    Bot,
    BookOpen
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import logoIcon from '/icon.png';

// ============ SECTION IDS FOR NAVIGATION ============
const SECTIONS = [
    { id: 'hero', label: 'Início' },
    { id: 'features', label: 'Diferenciais' },
    { id: 'about', label: 'Sobre' },
    { id: 'creator', label: 'Criador' },
];

// ============ DOTS NAVIGATION ============
function DotsNavigation({ activeSection }: { activeSection: string }) {
    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-3">
            {SECTIONS.map((section) => (
                <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="group relative flex items-center"
                    aria-label={`Ir para ${section.label}`}
                >
                    {/* Tooltip */}
                    <span className="absolute right-8 px-3 py-1.5 bg-gray-900/90 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {section.label}
                    </span>
                    {/* Dot */}
                    <span
                        className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${activeSection === section.id
                            ? 'bg-emerald-500 border-emerald-500 scale-125'
                            : 'bg-transparent border-gray-400 hover:border-emerald-400 hover:scale-110'
                            }`}
                    />
                </button>
            ))}
        </nav>
    );
}

// ============ FIXED HEADER ============
function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const container = document.getElementById('scroll-container');
        const handleScroll = () => {
            setIsScrolled((container?.scrollTop || 0) > 50);
        };
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md ${isScrolled
                ? 'bg-white/95 shadow-lg py-3'
                : 'bg-black/20 py-4'
                }`}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-1 transition-all ${isScrolled ? 'bg-emerald-50' : 'bg-white/20 backdrop-blur-sm'}`}>
                        <img src={logoIcon} alt="Veridia Saber" className="w-full h-full object-contain" />
                    </div>
                    <span className={`font-bold text-lg transition-colors ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                        Veridia Saber
                    </span>
                </div>

                {/* Nav Links (Desktop) */}
                <nav className="hidden md:flex items-center gap-6">
                    {SECTIONS.map((section) => (
                        <a
                            key={section.id}
                            href={`#${section.id}`}
                            className={`text-sm font-medium transition-colors hover:text-emerald-500 ${isScrolled ? 'text-gray-600' : 'text-white/80'
                                }`}
                        >
                            {section.label}
                        </a>
                    ))}
                </nav>
            </div>
        </header>
    );
}

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

            await supabase
                .from('beta_testers')
                .delete()
                .eq('id', data.id);

            setStatus('success');

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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
                <button onClick={handleClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={20} />
                </button>

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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email cadastrado</label>
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
        <section
            id="hero"
            className="h-screen w-full snap-start flex items-center relative overflow-hidden bg-gradient-to-br from-[#1a472a] via-[#234d32] to-[#1a3a24]"
        >
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 to-emerald-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-6 pt-20 relative z-10">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left: Content */}
                    <div className="text-white space-y-6 lg:space-y-8 text-center lg:text-left animate-fade-in">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                            <span className="text-white">Veridia Saber:</span>
                            <br />
                            <span className="bg-gradient-to-r from-emerald-300 to-purple-300 bg-clip-text text-transparent">
                                Sua enciclopédia botânica de bolso.
                            </span>
                        </h1>

                        <p className="text-base md:text-lg lg:text-xl text-emerald-100/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            Identifique espécies, organize coleções e gerencie projetos de campo.{' '}
                            <span className="font-semibold text-white">Disponível offline quando você precisar.</span>
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-start">
                            <button
                                onClick={onOpenDownloadModal}
                                className="group flex items-center justify-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-900/30 transition-all duration-300 hover:scale-105"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.523 0c.987.02 1.967.172 2.911.492a9.038 9.038 0 0 1 2.556 1.403l-6.986 8.11 6.986 8.106a9.049 9.049 0 0 1-2.556 1.407 9.13 9.13 0 0 1-2.911.492c-.18 0-.361-.01-.541-.02l-5.975-9.985L17.02.02c.18-.01.361-.02.541-.02zm-5.975 10.005L5.558.02C5.378.01 5.197 0 5.017 0a9.13 9.13 0 0 0-2.911.492A9.038 9.038 0 0 0 .55 1.895l6.986 8.11L.55 18.111a9.049 9.049 0 0 0 2.556 1.407 9.13 9.13 0 0 0 2.911.492c.18 0 .361-.01.541-.02l5.99-9.985z" />
                                </svg>
                                <span>Baixar para Android</span>
                                <Download size={16} className="opacity-70 group-hover:opacity-100" />
                            </button>

                            <button
                                disabled
                                className="flex items-center justify-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white/10 text-white/60 font-medium rounded-2xl border border-white/20 cursor-not-allowed"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                <span>iOS em breve</span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Phone Mockup - Centered between text and side dots */}
                    <div className="hidden sm:flex justify-center animate-float mt-8 lg:mt-0">
                        <div className="relative">
                            <div className="relative w-[160px] sm:w-[180px] md:w-[200px] lg:w-[240px] max-h-[60vh] aspect-[9/19] bg-gray-900 rounded-[2rem] md:rounded-[3rem] p-2 md:p-3 shadow-2xl shadow-black/50 border-4 border-gray-800">
                                <div className="w-full h-full rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden relative">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 md:w-32 h-5 md:h-6 bg-black rounded-b-2xl md:rounded-b-3xl z-10"></div>
                                    <img
                                        src="/Tela Inicial.png"
                                        alt="Tela inicial do Veridia Saber"
                                        className="w-full h-full object-cover object-top"
                                    />
                                </div>
                            </div>
                            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-emerald-500/20 blur-3xl rounded-full -z-10"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator - Hidden on very small screens to avoid overlap */}
            <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce hidden sm:flex">
                <span className="text-white/50 text-xs sm:text-sm">Role para baixo</span>
                <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/30 rounded-full flex justify-center pt-1.5 sm:pt-2">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/50 rounded-full animate-pulse"></div>
                </div>
            </div>
        </section>
    );
}

// ============ FEATURES SECTION (CAROUSEL) ============
function FeaturesSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    const features = [
        {
            icon: WifiOff,
            title: 'Coleções Offline',
            description: 'Catalogue plantas no seu dispositivo e acesse seus dados mesmo sem internet.',
            gradient: 'from-emerald-500 to-teal-600'
        },
        {
            icon: MapPin,
            title: 'Mapas Baixáveis',
            description: 'Baixe locais com mapas e todas as plantas para explorar em áreas sem sinal.',
            gradient: 'from-purple-500 to-violet-600'
        },
        {
            icon: Cloud,
            title: 'Sincronização Segura',
            description: 'Seus dados salvos no dispositivo e na nuvem automaticamente.',
            gradient: 'from-blue-500 to-cyan-600'
        },
        {
            icon: Bot,
            title: 'Assistente IA',
            description: 'Tire dúvidas e obtenha ajuda na identificação de espécies instantaneamente com nosso Chatbot inteligente.',
            gradient: 'from-indigo-500 to-purple-600'
        },
        {
            icon: BookOpen,
            title: 'Rigor Científico',
            description: 'Base de dados construída com referências bibliográficas e literatura acadêmica confiável.',
            gradient: 'from-amber-500 to-orange-600'
        }
    ];

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollLeft = container.scrollLeft;
        const cardWidth = container.offsetWidth * 0.75; // 75% width per card on mobile
        const newIndex = Math.round(scrollLeft / cardWidth);
        setActiveIndex(Math.min(newIndex, features.length - 1));
    };

    const scrollToIndex = (index: number) => {
        const container = document.getElementById('features-carousel');
        if (container) {
            const cardWidth = container.offsetWidth * 0.75;
            container.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
        }
    };

    return (
        <section
            id="features"
            className="min-h-screen w-full snap-start flex flex-col justify-center items-center bg-white px-4 py-16 md:py-12 overflow-y-auto"
        >
            {/* Hide scrollbar styles */}
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="container mx-auto max-w-6xl">
                {/* Section header */}
                <div className="text-center mb-6 md:mb-10">
                    <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
                        Diferenciais
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        Por que escolher o Veridia Saber?
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-lg">
                        Desenvolvido pensando nas necessidades reais de pesquisadores e entusiastas da botânica.
                    </p>
                </div>

                {/* Desktop: Grid layout */}
                <div className="hidden lg:grid lg:grid-cols-5 gap-4">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative bg-gray-50 rounded-xl p-4 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 border border-gray-100 hover:border-gray-200"
                        >
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform duration-500`}>
                                <feature.icon size={20} className="text-white" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed text-xs">{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* Mobile/Tablet: Carousel */}
                <div className="lg:hidden">
                    <div
                        id="features-carousel"
                        className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4"
                        onScroll={handleScroll}
                    >
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="flex-shrink-0 w-[75%] sm:w-[45%] snap-center bg-gray-50 rounded-xl p-5 border border-gray-100"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-md`}>
                                    <feature.icon size={24} className="text-white" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed text-sm">{feature.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Dots navigation */}
                    <div className="flex justify-center gap-2 mt-4">
                        {features.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => scrollToIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === index
                                    ? 'bg-purple-600 w-6'
                                    : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                aria-label={`Ir para slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ============ ABOUT SECTION (ASYMMETRIC LAYOUT) ============
function AboutSection() {
    const [speciesCount, setSpeciesCount] = useState<number | null>(null);

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

    const stats = [
        {
            value: speciesCount !== null ? speciesCount.toLocaleString('pt-BR') : '...',
            label: 'Espécies Catalogadas',
            icon: BookOpen,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100'
        },
        {
            value: 'Offline',
            label: 'Coleções Locais',
            icon: WifiOff,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            value: 'Sync',
            label: 'Automática',
            icon: Cloud,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        }
    ];

    return (
        <section
            id="about"
            className="min-h-screen w-full snap-start flex flex-col justify-center bg-gradient-to-b from-emerald-50 to-white relative overflow-y-auto px-4 py-10"
        >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-200 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-100 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto relative z-10">
                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center max-w-5xl mx-auto">

                    {/* Left Column: Text Content */}
                    <div className="text-left">
                        {/* Small Label */}
                        <p className="text-emerald-600 text-xs font-semibold tracking-widest uppercase mb-2">
                            Nossa Missão
                        </p>

                        {/* Manifesto */}
                        <h2 className="text-sm sm:text-base lg:text-xl font-medium text-gray-800 leading-relaxed mb-2 lg:mb-4">
                            O Veridia Saber é uma ponte. Uma ponte que liga o entusiasta ao cientista, o curioso ao pesquisador e, todos nós, à biodiversidade incrível que nos rodeia.{' '}
                            <span className="font-bold text-emerald-700">
                                A tecnologia a serviço do conhecimento e da natureza!
                            </span>
                        </h2>

                        {/* Complementary Text */}
                        <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">
                            Desenvolvido para auxiliar no estudo e catalogação da biodiversidade brasileira,
                            o aplicativo permite identificar espécies, registrar ocorrências e
                            manter coleções organizadas - mesmo em áreas sem conexão.
                        </p>
                    </div>

                    {/* Right Column: Stats Cards - Stack vertically on mobile for readability */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="bg-white/80 backdrop-blur-sm rounded-lg p-3 lg:p-4 shadow-md border border-gray-100/80 flex flex-row items-center gap-3 text-left"
                            >
                                {/* Icon */}
                                <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                                    <stat.icon size={20} className={stat.color} />
                                </div>

                                {/* Value & Label */}
                                <div>
                                    <div className={`text-sm lg:text-lg font-bold ${stat.color}`}>
                                        {stat.value}
                                    </div>
                                    <div className="text-gray-500 text-xs lg:text-xs">
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}


// ============ ABOUT CREATOR SECTION (EDITORIAL) ============
function AboutCreatorSection() {
    return (
        <section
            id="creator"
            className="min-h-screen w-full snap-start flex flex-col bg-stone-50 relative overflow-y-auto"
        >
            {/* Decorative quote mark - smaller on mobile */}
            <div className="absolute top-16 left-4 lg:left-20 text-[8rem] sm:text-[12rem] lg:text-[20rem] font-serif text-emerald-100/40 leading-none pointer-events-none select-none" style={{ fontFamily: 'Georgia, serif' }}>
                "
            </div>

            {/* Spacer for fixed navbar - smaller on mobile */}
            <div className="h-14 sm:h-16 flex-shrink-0"></div>

            {/* Main Content - reduced padding on mobile */}
            <div className="flex-1 container mx-auto px-4 lg:px-8 py-4 sm:py-8 relative z-10 flex flex-col justify-center">
                <div className="grid lg:grid-cols-5 gap-6 lg:gap-12 items-center max-w-6xl mx-auto">

                    {/* Left Column: Photo (40%) - smaller on mobile */}
                    <div className="lg:col-span-2 flex flex-col items-center">
                        {/* Photo with modern rounded corners */}
                        <div className="w-24 h-32 sm:w-40 sm:h-52 lg:w-56 lg:h-72 rounded-xl sm:rounded-2xl lg:rounded-tl-[3rem] lg:rounded-br-[3rem] shadow-lg shadow-gray-300/50 overflow-hidden mb-2 sm:mb-3">
                            <img
                                src="/jayan-moura.jpeg"
                                alt="Jayan de Moura"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Caption */}
                        <p className="text-gray-500 text-[10px] sm:text-xs lg:text-sm font-medium">
                            Jayan de Moura - <span className="text-emerald-600">Fundador</span>
                        </p>
                    </div>

                    {/* Right Column: Text (60%) */}
                    <div className="lg:col-span-3 text-left">
                        {/* Small Label */}
                        <p className="text-emerald-600 text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-1 sm:mb-2">
                            Sobre o Criador
                        </p>

                        {/* Title - smaller on mobile */}
                        <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-4 lg:mb-6" style={{ fontFamily: 'Georgia, serif' }}>
                            De Entusiasta para <span className="text-emerald-700">Cientista</span>
                        </h2>

                        {/* Paragraphs with highlights - compact on mobile */}
                        <div className="space-y-2 sm:space-y-3 lg:space-y-4 text-[11px] sm:text-sm lg:text-base text-gray-700 leading-relaxed">
                            <p>
                                Minha conexão com a botânica começou cedo, ainda na adolescência. A dificuldade de acesso à informação sempre me incomodou - sites antigos e nada práticos para quem estava em campo.
                            </p>

                            <p>
                                O Veridia Saber nasceu dessa inquietação. O que começou em 2025 como um simples guia de estudos, evoluiu para um laboratório de bolso com filosofia{' '}
                                <span className="font-bold text-emerald-700">Offline-First</span>.
                            </p>

                            <p>
                                Seja catalogando espécies, usando{' '}
                                <span className="font-bold text-emerald-700">Chat Bot</span>{' '}
                                para identificação ou baixando mapas de áreas remotas, o objetivo é criar a ponte que liga a curiosidade do entusiasta à precisão do{' '}
                                <span className="font-bold text-emerald-700">Cientista</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="flex-shrink-0 w-full py-3 bg-gray-900/90 backdrop-blur-sm">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center p-1">
                                <img src={logoIcon} alt="Veridia Saber" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-sm font-bold text-white">Veridia Saber</span>
                        </div>

                        {/* Links */}
                        <nav className="flex flex-wrap justify-center gap-3 text-[10px] sm:text-xs">
                            <Link to="/politica" className="text-gray-300 hover:text-white transition-colors">
                                Privacidade
                            </Link>
                            <Link to="/termos" className="text-gray-300 hover:text-white transition-colors">
                                Termos
                            </Link>
                            <a
                                href="https://painel-admin.veridiasaber.com.br"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                            >
                                Admin
                                <ExternalLink size={10} />
                            </a>
                        </nav>

                        {/* Copyright */}
                        <div className="text-gray-400 text-[10px] sm:text-xs">
                            2026 Veridia Saber
                        </div>
                    </div>
                </div>
            </footer>
        </section>
    );
}


// ============ MAIN LANDING PAGE ============
export default function LandingPage() {
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('hero');

    // Track active section on scroll
    useEffect(() => {
        const container = document.getElementById('scroll-container');

        const handleScroll = () => {
            const scrollPosition = container?.scrollTop || 0;
            const windowHeight = window.innerHeight;

            SECTIONS.forEach((section) => {
                const element = document.getElementById(section.id);
                if (element) {
                    const { offsetTop } = element;
                    if (scrollPosition >= offsetTop - windowHeight / 2 && scrollPosition < offsetTop + windowHeight / 2) {
                        setActiveSection(section.id);
                    }
                }
            });
        };

        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Header />
            <DotsNavigation activeSection={activeSection} />

            <main
                id="scroll-container"
                className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth"
            >
                <HeroSection onOpenDownloadModal={() => setIsDownloadModalOpen(true)} />
                <FeaturesSection />
                <AboutSection />
                <AboutCreatorSection />
            </main>

            <BetaDownloadModal
                isOpen={isDownloadModalOpen}
                onClose={() => setIsDownloadModalOpen(false)}
            />
        </>
    );
}
