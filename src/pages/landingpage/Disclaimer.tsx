import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ChevronDown, ChevronUp, AlertTriangle, BookOpen, Users, Server, CheckCircle } from 'lucide-react';
import logoIcon from '/icon.png';

// ============ HEADER ============
function Header() {
    return (
        <header className="bg-gradient-to-r from-[#1a472a] via-[#234d32] to-[#1a3a24] text-white py-4 px-6">
            <div className="container mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1">
                        <img src={logoIcon} alt="Veridia Saber" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xl font-bold">Veridia Saber</span>
                </Link>
                <Link
                    to="/"
                    className="flex items-center gap-2 text-emerald-200 hover:text-white transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span>Voltar</span>
                </Link>
            </div>
        </header>
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
                        <Link to="/disclaimer" className="text-white font-medium">
                            Isenção de Responsabilidade
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

// ============ ACCORDION ITEM ============
interface AccordionItemProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isWarning?: boolean;
    defaultOpen?: boolean;
}

function AccordionItem({ title, icon, children, isWarning = false, defaultOpen = false }: AccordionItemProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const baseClasses = "w-full rounded-xl border transition-all duration-300";
    const warningClasses = isWarning
        ? "border-orange-200 bg-orange-50/50"
        : "border-gray-200 bg-white";

    const headerWarningClasses = isWarning
        ? "hover:bg-orange-100/50"
        : "hover:bg-gray-50";

    const iconContainerClasses = isWarning
        ? "bg-orange-100 text-orange-600"
        : "bg-emerald-100 text-emerald-600";

    return (
        <div className={`${baseClasses} ${warningClasses}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-5 text-left rounded-xl transition-colors ${headerWarningClasses}`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconContainerClasses}`}>
                        {icon}
                    </div>
                    <h3 className={`text-lg font-semibold ${isWarning ? 'text-orange-800' : 'text-gray-900'}`}>
                        {title}
                    </h3>
                </div>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    {isOpen ? (
                        <ChevronUp size={20} className="text-gray-500" />
                    ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                    )}
                </div>
            </button>

            <div
                className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="px-5 pb-5">
                    <div className={`pt-4 border-t ${isWarning ? 'border-orange-200' : 'border-gray-100'}`}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============ DISCLAIMER PAGE ============
export default function Disclaimer() {
    const navigate = useNavigate();

    // Scroll to top when page loads
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-1 py-12">
                <article className="max-w-3xl mx-auto px-6">
                    {/* Header Section */}
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Isenção de Responsabilidade e Termos de Uso
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Por favor, leia atentamente antes de utilizar o Veridia Saber.
                        </p>
                    </div>

                    {/* Accordion Sections */}
                    <div className="space-y-4 mb-10">
                        {/* 1. Finalidade Educacional */}
                        <AccordionItem
                            title="1. Finalidade Educacional e Científica"
                            icon={<BookOpen size={20} />}
                            defaultOpen={true}
                        >
                            <p className="text-gray-700 leading-relaxed">
                                O Veridia Saber é uma ferramenta destinada ao registro, catalogação e auxílio na identificação botânica.
                                Embora busquemos a máxima precisão taxonômica através de curadoria, as informações aqui contidas{' '}
                                <strong className="text-gray-900">não substituem a análise de um especialista</strong> in loco.
                                A taxonomia é uma ciência dinâmica e sujeita a revisões.
                            </p>
                        </AccordionItem>

                        {/* 2. Riscos à Saúde - CRITICAL WARNING */}
                        <AccordionItem
                            title="2. Riscos à Saúde e Uso Medicinal"
                            icon={<AlertTriangle size={20} />}
                            isWarning={true}
                            defaultOpen={true}
                        >
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-orange-100 rounded-lg border border-orange-300">
                                    <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={24} />
                                    <div>
                                        <p className="font-bold text-orange-800 mb-2">
                                            ⚠️ Aviso de Segurança
                                        </p>
                                        <p className="text-orange-700 leading-relaxed">
                                            O Veridia Saber <strong className="text-orange-900">NÃO</strong> deve ser utilizado como única fonte
                                            para determinar a comestibilidade ou uso medicinal de qualquer espécie.
                                        </p>
                                    </div>
                                </div>
                                <p className="text-gray-700 leading-relaxed">
                                    A identificação incorreta de plantas pode levar a intoxicações graves ou fatais.{' '}
                                    <strong className="text-red-700">
                                        Nunca ingira ou utilize uma planta baseando-se apenas em informações deste aplicativo.
                                    </strong>
                                </p>
                                <p className="text-gray-600 text-sm italic">
                                    Sempre consulte um especialista qualificado (botânico, agrônomo, farmacêutico) antes de qualquer uso medicinal ou alimentar.
                                </p>
                            </div>
                        </AccordionItem>

                        {/* 3. Conteúdo Colaborativo */}
                        <AccordionItem
                            title="3. Conteúdo Colaborativo (Crowdsourcing)"
                            icon={<Users size={20} />}
                        >
                            <p className="text-gray-700 leading-relaxed">
                                Parte do acervo é construído de forma colaborativa. O Veridia Saber não se responsabiliza pela titularidade
                                de direitos autorais de imagens enviadas por terceiros, embora nos reservemos o direito de remover conteúdo que
                                viole propriedades intelectuais mediante denúncia.
                            </p>
                            <p className="text-gray-600 text-sm mt-3">
                                Para reportar violações de direitos autorais, entre em contato:{' '}
                                <a href="mailto:contatos@veridiasaber.com.br" className="text-emerald-600 hover:text-emerald-700 underline">
                                    contatos@veridiasaber.com.br
                                </a>
                            </p>
                        </AccordionItem>

                        {/* 4. Disponibilidade do Serviço */}
                        <AccordionItem
                            title="4. Disponibilidade do Serviço"
                            icon={<Server size={20} />}
                        >
                            <p className="text-gray-700 leading-relaxed">
                                O serviço é fornecido <strong className="text-gray-900">"como está"</strong> (as is), sem garantias de
                                disponibilidade ininterrupta. Podemos realizar manutenções programadas ou emergenciais que podem
                                temporariamente afetar o acesso ao aplicativo.
                            </p>
                            <p className="text-gray-600 text-sm mt-3">
                                O Veridia Saber não se responsabiliza por perdas de dados ou interrupções de serviço fora de nosso controle.
                            </p>
                        </AccordionItem>
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-lg hover:shadow-xl"
                        >
                            <CheckCircle size={20} />
                            <span>Entendi</span>
                        </button>
                        <Link
                            to="/"
                            className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                        >
                            <ArrowLeft size={18} />
                            <span>Voltar para o Início</span>
                        </Link>
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
