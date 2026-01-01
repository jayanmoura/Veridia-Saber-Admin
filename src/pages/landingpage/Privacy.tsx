import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import logoIcon from '/icon.png';

// ============ HEADER ============
function Header() {
    return (
        <header className="bg-gradient-to-r from-[#1a472a] via-[#234d32] to-[#1a3a24] text-white py-4 px-6">
            <div className="container mx-auto flex items-center justify-between">
                <Link to="/landing" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1">
                        <img src={logoIcon} alt="Veridia Saber" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xl font-bold">Veridia Saber</span>
                </Link>
                <Link
                    to="/landing"
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
                        <Link to="/politica" className="text-white font-medium">
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

// ============ PRIVACY PAGE ============
export default function Privacy() {
    // Scroll to top when page loads
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-1 py-12">
                <article className="max-w-3xl mx-auto px-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        Política de Privacidade
                    </h1>
                    <p className="text-gray-500 mb-8">Última atualização: Janeiro de 2026</p>

                    <div className="prose prose-lg prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed mb-8">
                            O Veridia Saber ("nós", "nosso") preza pela sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações ao utilizar nosso aplicativo móvel.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Informações que Coletamos</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Para o funcionamento correto do aplicativo, solicitamos as seguintes permissões e dados:
                        </p>
                        <ul className="space-y-4 text-gray-700">
                            <li>
                                <strong className="text-gray-900">Câmera:</strong> Necessária para tirar fotos de plantas e espécimes para catalogação dentro dos seus projetos. As fotos ficam salvas no seu dispositivo e, se sincronizadas, em nosso banco de dados seguro.
                            </li>
                            <li>
                                <strong className="text-gray-900">Localização (GPS):</strong> Coletamos dados de localização precisos (apenas quando o app está em uso) para georreferenciar as coletas botânicas no mapa. Isso permite que você saiba exatamente onde uma planta foi encontrada.
                            </li>
                            <li>
                                <strong className="text-gray-900">Dados da Conta:</strong> Coletamos seu nome e e-mail para criação de conta e sincronização de dados entre dispositivos.
                            </li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Como Usamos Seus Dados</h2>
                        <ul className="space-y-4 text-gray-700">
                            <li>
                                <strong className="text-gray-900">Funcionamento:</strong> Para permitir a criação de coleções, identificação de espécies e mapeamento de flora.
                            </li>
                            <li>
                                <strong className="text-gray-900">Sincronização:</strong> Para salvar seu progresso na nuvem (via Supabase), garantindo que você não perca dados se trocar de celular.
                            </li>
                            <li>
                                <strong className="text-gray-900">Melhorias:</strong> Podemos usar dados anônimos para corrigir erros (crashes) e melhorar a performance do app.
                            </li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Compartilhamento de Dados</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Nós <strong className="text-gray-900">não vendemos</strong> seus dados pessoais para terceiros. Seus dados são armazenados em serviços de nuvem seguros (Supabase) necessários para a operação do aplicativo.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Seus Direitos (LGPD)</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Você tem o direito de solicitar a exclusão completa da sua conta e de todos os dados associados a qualquer momento entrando em contato conosco.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Contato</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Se tiver dúvidas sobre esta política, entre em contato:{' '}
                            <a href="mailto:jayanmoura@gmail.com" className="text-emerald-600 hover:text-emerald-700 underline">
                                jayanmoura@gmail.com
                            </a>
                        </p>
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
