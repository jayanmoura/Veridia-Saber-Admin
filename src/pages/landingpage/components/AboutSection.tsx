export function AboutSection() {
  return (
    <section id="about" className="py-20 px-6 bg-white border-t border-[#dde8d5] text-left">
      <div className="container mx-auto max-w-4xl space-y-6">
        <span className="text-[#4a7c5a] text-xs font-bold uppercase tracking-widest block mb-2">
          SOBRE O PROJETO
        </span>
        <h2 className="text-3xl font-bold text-[#1a3a1f] leading-tight">
          Uma ponte entre a tecnologia e a natureza
        </h2>
        
        <div className="grid md:grid-cols-12 gap-8 items-start pt-2">
          {/* Texto à esquerda */}
          <div className="md:col-span-8 text-sm md:text-base text-[#4a7c5a] leading-relaxed space-y-4 font-normal">
            <p>
              O <strong className="text-[#1a3a1f] font-bold">Veridia Saber</strong> é uma ponte. Uma ponte que liga o entusiasta ao cientista, o curioso ao pesquisador e, todos nós, à biodiversidade incrível que nos rodeia. A tecnologia a serviço do conhecimento e da natureza!
            </p>
            <p>
              Desenvolvido para auxiliar no estudo e catalogação da biodiversidade brasileira, o aplicativo permite identificar espécies, registrar ocorrências e manter coleções organizadas - mesmo em áreas sem conexão.
            </p>
          </div>

          {/* Ficha técnica à direita */}
          <div className="md:col-span-4 p-5 rounded-xl bg-[#f0f5ee] border border-[#dde8d5] text-xs text-[#1a3a1f] space-y-3 font-semibold">
            <div className="flex justify-between items-center pb-2 border-b border-[#dde8d5]/60">
              <span>Início</span>
              <span className="text-[#4a7c5a] font-medium">2025</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#dde8d5]/60">
              <span>Foco</span>
              <span className="text-[#4a7c5a] font-medium">Offline-First</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Domínio</span>
              <span className="text-[#4a7c5a] font-medium">Biodiversidade</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
