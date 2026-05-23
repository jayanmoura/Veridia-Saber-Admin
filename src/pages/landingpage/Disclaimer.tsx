import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, BookOpen, Users, Server, CheckCircle } from 'lucide-react';
import { LegalPageLayout } from './components/LegalPageLayout';

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

  const baseClasses = "w-full rounded-2xl border transition-all duration-300 overflow-hidden";
  const warningClasses = isWarning
    ? "border-amber-200 bg-amber-50/50"
    : "border-[#dde8d5] bg-white";

  const headerWarningClasses = isWarning
    ? "hover:bg-amber-100/30"
    : "hover:bg-[#f8faf6]";

  const iconContainerClasses = isWarning
    ? "bg-amber-100 text-amber-600"
    : "bg-[#f0f5ee] text-[#4a7c5a]";

  return (
    <div className={`${baseClasses} ${warningClasses} text-left`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer ${headerWarningClasses}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconContainerClasses}`}>
            {icon}
          </div>
          <h3 className={`text-base sm:text-lg font-bold ${isWarning ? 'text-amber-900' : 'text-[#1a3a1f]'}`}>
            {title}
          </h3>
        </div>
        <div className={`transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
          {isOpen ? (
            <ChevronUp size={20} className="text-stone-500" />
          ) : (
            <ChevronDown size={20} className="text-stone-500" />
          )}
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5">
          <div className={`pt-4 border-t ${isWarning ? 'border-amber-200' : 'border-[#dde8d5]/65'}`}>
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
    <LegalPageLayout
      title="Isenção de Responsabilidade e Termos"
      tag="Isenção"
      updatedAt="Por favor, leia atentamente antes de utilizar o Veridia Saber."
    >
      {/* Accordion Sections */}
      <div className="space-y-4 mb-10">
        {/* 1. Finalidade Educacional */}
        <AccordionItem
          title="1. Finalidade Educacional e Científica"
          icon={<BookOpen size={20} />}
          defaultOpen={true}
        >
          <p className="text-[#4a5a44] text-sm sm:text-base leading-relaxed">
            O Veridia Saber é uma ferramenta destinada ao registro, catalogação e auxílio na identificação botânica.
            Embora busquemos a máxima precisão taxonômica através de curadoria, as informações aqui contidas{' '}
            <strong className="text-[#1a3a1f] font-bold">não substituem a análise de um especialista</strong> in loco.
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
            <div className="flex items-start gap-3 p-4 bg-amber-100/50 rounded-xl border border-amber-200 text-left">
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <p className="font-bold text-amber-900 mb-2">
                  ⚠️ Aviso de Segurança
                </p>
                <p className="text-amber-800 text-sm leading-relaxed font-semibold">
                  O Veridia Saber <strong className="font-bold">NÃO</strong> deve ser utilizado como única fonte
                  para determinar a comestibilidade ou uso medicinal de qualquer espécie.
                </p>
              </div>
            </div>
            <p className="text-[#4a5a44] text-sm sm:text-base leading-relaxed">
              A identificação incorreta de plantas pode levar a intoxicações graves ou fatais.{' '}
              <strong className="text-red-700 font-bold">
                Nunca ingira ou utilize uma planta baseando-se apenas em informações deste aplicativo.
              </strong>
            </p>
            <p className="text-stone-500 text-xs italic">
              Sempre consulte um especialista qualificado (botânico, agrônomo, farmacêutico) antes de qualquer uso medicinal ou alimentar.
            </p>
          </div>
        </AccordionItem>

        {/* 3. Conteúdo Colaborativo */}
        <AccordionItem
          title="3. Conteúdo Colaborativo (Crowdsourcing)"
          icon={<Users size={20} />}
        >
          <p className="text-[#4a5a44] text-sm sm:text-base leading-relaxed">
            Parte do acervo é construído de forma colaborativa. O Veridia Saber não se responsabiliza pela titularidade
            de direitos autorais de imagens enviadas por terceiros, embora nos reservemos o direito de remover conteúdo que
            viole propriedades intelectuais mediante denúncia.
          </p>
          <p className="text-stone-500 text-xs mt-3">
            Para reportar violações de direitos autorais, entre em contato:{' '}
            <a href="mailto:contatos@veridiasaber.com.br" className="text-[#5fcf6e] hover:text-[#4eb85c] underline font-medium">
              contatos@veridiasaber.com.br
            </a>
          </p>
        </AccordionItem>

        {/* 4. Disponibilidade do Serviço */}
        <AccordionItem
          title="4. Disponibilidade do Serviço"
          icon={<Server size={20} />}
        >
          <p className="text-[#4a5a44] text-sm sm:text-base leading-relaxed">
            O serviço é fornecido <strong className="text-[#1a3a1f] font-bold">"como está"</strong> (as is), sem garantias de
            disponibilidade ininterrupta. Podemos realizar manutenções programadas ou emergenciais que podem
            temporariamente afetar o acesso ao aplicativo.
          </p>
          <p className="text-stone-500 text-xs mt-3">
            O Veridia Saber não se responsabiliza por perdas de dados ou interrupções de serviço fora de nosso controle.
          </p>
        </AccordionItem>
      </div>

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-[#dde8d5]">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-[#1a3a1f] hover:bg-[#2d5a3d] text-white font-semibold rounded-full transition-all shadow-md hover:scale-102 active:scale-98 cursor-pointer text-sm"
        >
          <CheckCircle size={18} className="text-[#5fcf6e]" />
          <span>Entendi</span>
        </button>
        <Link
          to="/"
          className="flex items-center justify-center gap-2 px-6 py-3 text-stone-600 hover:text-stone-900 font-semibold transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          <span>Voltar para o Início</span>
        </Link>
      </div>
    </LegalPageLayout>
  );
}
