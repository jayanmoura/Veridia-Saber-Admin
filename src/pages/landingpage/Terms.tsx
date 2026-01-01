import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, AlertTriangle } from 'lucide-react';
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
                        <Link to="/politica" className="text-gray-400 hover:text-white transition-colors">
                            Política de Privacidade
                        </Link>
                        <Link to="/termos" className="text-white font-medium">
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

// ============ TERMS PAGE ============
export default function Terms() {
    // Scroll to top when page loads
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-1 py-12">
                <article className="max-w-3xl mx-auto px-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                        Termos de Uso
                    </h1>

                    <div className="prose prose-lg prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed mb-8">
                            Ao baixar ou usar o aplicativo Veridia Saber, você concorda automaticamente com estes termos.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Uso do Aplicativo</h2>
                        <p className="text-gray-700 leading-relaxed">
                            O Veridia Saber é uma ferramenta educacional e de auxílio à pesquisa de campo. Você concorda em usar o aplicativo apenas para fins legais e éticos.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Isenção de Responsabilidade</h2>

                        {/* Warning Alert */}
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-bold text-amber-800 mb-2">Importante!</p>
                                    <p className="text-amber-700 text-sm leading-relaxed">
                                        O aplicativo NÃO deve ser usado como única fonte para determinar se uma planta é comestível, medicinal ou tóxica. O desenvolvedor não se responsabiliza por quaisquer danos à saúde, envenenamentos ou prejuízos causados pelo uso incorreto das informações contidas no aplicativo. <strong>Consulte sempre um especialista.</strong>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <ul className="space-y-4 text-gray-700">
                            <li>
                                <strong className="text-gray-900">Identificação de Espécies:</strong> O Veridia Saber fornece ferramentas para auxiliar na identificação de plantas, mas não garante 100% de precisão. A identificação botânica é complexa e sujeita a erros.
                            </li>
                            <li>
                                <strong className="text-gray-900">Segurança e Saúde:</strong> O aplicativo NÃO deve ser usado como única fonte para determinar se uma planta é comestível, medicinal ou tóxica.
                            </li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Propriedade Intelectual</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Todo o código, design e marca "Veridia Saber" são propriedade intelectual do desenvolvedor. Você não tem permissão para copiar, modificar ou fazer engenharia reversa do aplicativo.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Conteúdo do Usuário</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Você é responsável pelas fotos e informações que cadastra no aplicativo. Não envie conteúdo ofensivo, ilegal ou que viole direitos autorais de terceiros.
                        </p>

                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Alterações nos Termos</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Podemos atualizar estes termos periodicamente. Recomendamos que você revise esta página regularmente.
                        </p>
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
