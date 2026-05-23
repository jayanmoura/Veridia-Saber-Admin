import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

export default function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf6] text-stone-850">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl text-left">
        
        {/* 1. Header da Página */}
        <div className="space-y-2 pb-4 border-b border-[#dde8d5]">
          <span className="text-[#4a7c5a] text-xs font-bold uppercase tracking-widest block">
            SOBRE O PROJETO
          </span>
          <h1 className="text-4xl font-bold text-[#1a3a1f]">
            O Veridia Saber
          </h1>
        </div>

        {/* 2. Seção Principal (Duas Colunas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start mt-10">
          
          {/* Coluna Esquerda: Texto */}
          <div className="space-y-6 text-[#4a5a44] leading-relaxed text-base font-normal">
            <p>
              O Veridia Saber nasceu de uma inquietação simples: por que é tão difícil acessar informação botânica de qualidade em campo? Sites desatualizados, interfaces confusas e zero suporte offline — uma realidade que pesquisadores e entusiastas da natureza enfrentam há décadas.
            </p>
            <p>
              A resposta foi construir do zero uma plataforma pensada para quem está com as mãos na terra. Uma enciclopédia botânica que funciona sem internet, que permite registrar ocorrências com GPS, fotografar espécimes em alta resolução e sincronizar tudo automaticamente quando o sinal volta.
            </p>
            <p>
              Mais do que um aplicativo, o Veridia Saber é uma ponte entre o rigor da ciência e a curiosidade do campo. Entre o herbário e o smartphone. Entre quem cataloga e quem aprende.
            </p>
          </div>

          {/* Coluna Direita: Cards Empilhados */}
          <div className="space-y-6">
            
            {/* Card 1: O Projeto */}
            <div className="bg-[#f0f5ee] rounded-2xl border border-[#dde8d5] p-6 shadow-xs text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4a7c5a] mb-3 block">
                O PROJETO
              </span>
              <div className="space-y-1">
                <div className="flex justify-between items-center py-2.5 border-b border-[#dde8d5]">
                  <span className="text-xs text-[#7a9a7a] uppercase tracking-wide font-semibold">Fundado em</span>
                  <span className="text-sm font-medium text-[#1a3a1f]">2025</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-[#dde8d5]">
                  <span className="text-xs text-[#7a9a7a] uppercase tracking-wide font-semibold">Filosofia</span>
                  <span className="text-sm font-medium text-[#1a3a1f]">Offline-First</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-xs text-[#7a9a7a] uppercase tracking-wide font-semibold">Foco</span>
                  <span className="text-sm font-medium text-[#1a3a1f]">Biodiversidade brasileira</span>
                </div>
              </div>
            </div>

            {/* Card 2: Autoria */}
            <div className="bg-white rounded-2xl border border-[#dde8d5] p-6 shadow-xs text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4a7c5a] mb-2 block">
                AUTORIA
              </span>
              <h3 className="font-semibold text-[#1a3a1f] text-base mb-1">
                Quem desenvolveu o projeto?
              </h3>
              <p className="text-sm text-[#7a9a7a] font-normal leading-relaxed mb-4">
                Conheça a história e a motivação por trás do Veridia Saber.
              </p>
              <div className="pt-2">
                <Link
                  to="/criador"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#5fcf6e] hover:text-[#4eb85c] transition-colors"
                >
                  <span>Conheça o Criador</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

          </div>

        </div>

        {/* 3. Divider */}
        <div className="border-t border-[#dde8d5] my-12" />

        {/* 4. Seção "Como funciona" (Três Colunas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
          
          {/* Card A */}
          <div className="text-left space-y-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#5fcf6e] w-8 h-8">
              <path d="M12 2C6 2 2 8 2 12c0 5.5 4.5 9 10 9s10-3.5 10-9C22 8 18 2 12 2z"/>
              <path d="M12 2v19M2 12h20"/>
            </svg>
            <h3 className="font-semibold text-[#1a3a1f] text-lg">
              Catálogo Científico
            </h3>
            <p className="text-sm text-[#4a7c5a] leading-relaxed font-normal">
              Acesse fichas taxonômicas completas de espécies e famílias botânicas, com imagens em alta resolução e dados georreferenciados.
            </p>
          </div>

          {/* Card B */}
          <div className="text-left space-y-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#5fcf6e] w-8 h-8">
              <path d="M12 2C6 2 2 8 2 12c0 5.5 4.5 9 10 9s10-3.5 10-9C22 8 18 2 12 2z"/>
              <path d="M12 2v19M2 12h20"/>
            </svg>
            <h3 className="font-semibold text-[#1a3a1f] text-lg">
              Coleta em Campo
            </h3>
            <p className="text-sm text-[#4a7c5a] leading-relaxed font-normal">
              Registre ocorrências, fotografe espécimes e organize suas coleções diretamente no smartphone — mesmo sem conexão com a internet.
            </p>
          </div>

          {/* Card C */}
          <div className="text-left space-y-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#5fcf6e] w-8 h-8">
              <path d="M12 2C6 2 2 8 2 12c0 5.5 4.5 9 10 9s10-3.5 10-9C22 8 18 2 12 2z"/>
              <path d="M12 2v19M2 12h20"/>
            </svg>
            <h3 className="font-semibold text-[#1a3a1f] text-lg">
              Sincronização Automática
            </h3>
            <p className="text-sm text-[#4a7c5a] leading-relaxed font-normal">
              Quando o sinal volta, todos os dados coletados offline são sincronizados automaticamente com o banco de dados central.
            </p>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
