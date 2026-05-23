import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

export default function CriadorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf6] text-stone-850">
      <Navbar />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-6xl text-left">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          
          {/* Coluna da Esquerda (Foto e Ficha) */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start gap-6">
            {/* Foto Real */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden border border-[#dde8d5] shadow-xs">
              <img
                src="/jayan-moura.jpeg"
                alt="Jayan de Moura"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Card de Ficha Lateral */}
            <div className="w-full p-5 rounded-xl bg-white border border-[#dde8d5] text-xs text-[#1a3a1f] space-y-3 font-semibold shadow-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#dde8d5]/60">
                <span>Em formação</span>
                <span className="text-[#4a7c5a] font-medium">Eng. Florestal — UFRRJ</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#dde8d5]/60">
                <span>Localização</span>
                <span className="text-[#4a7c5a] font-medium">Seropédica, RJ</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Projeto</span>
                <span className="text-[#4a7c5a] font-medium">Desde 2025</span>
              </div>
            </div>
          </div>

          {/* Coluna da Direita (Biografia) */}
          <div className="md:col-span-8 space-y-6">
            <span className="text-[#4a7c5a] text-xs font-bold uppercase tracking-widest block">
              SOBRE O CRIADOR
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1a3a1f] leading-tight">
              De Entusiasta para Cientista
            </h1>

            <div className="text-sm sm:text-base text-[#4a7c5a] leading-relaxed space-y-4 font-normal">
              <p>
                Minha conexão com a botânica começou cedo, ainda na adolescência. A dificuldade de acesso à informação sempre me incomodou - sites antigos e nada práticos para quem estava em campo.
              </p>
              <p>
                O Veridia Saber nasceu dessa inquietação. O que começou em 2025 como um simples guia de estudos, evoluiu para um laboratório de bolso com filosofia Offline-First.
              </p>
              <p>
                Seja catalogando espécies, usando Chat Bot para identificação ou baixando mapas de áreas remotas, o objetivo é criar a ponte que liga a curiosidade do entusiasta à precisão do Cientista.
              </p>
            </div>

            <div className="pt-2">
              <p className="font-bold text-[#4a7c5a]">
                Jayan de Moura
                <span className="font-medium text-xs block text-[#4a7c5a]/75 mt-0.5">Fundador</span>
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
