import { Download } from 'lucide-react';

export function AppCTA() {
  return (
    <section id="app-cta" className="py-10 px-6 bg-transparent">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-2xl p-8 md:p-12 border border-[#dde8d5] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden text-left shadow-xs">
          
          {/* Text Content */}
          <div className="space-y-4 max-w-lg relative z-10">
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#1a3a1f]">
              Quer coletar em campo?
            </h3>
            <p className="text-sm md:text-base text-[#4a5a44] leading-relaxed font-medium">
              Baixe o aplicativo oficial do Veridia Saber para cadastrar ocorrências ecológicas, registrar imagens e gerenciar coleções físicas mesmo estando sem conexão de internet (100% offline).
            </p>
            <div className="pt-2">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#1a3a1f] hover:bg-[#2d5a3d] text-white font-bold rounded-full shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-sm"
              >
                <Download className="w-4 h-4 text-[#5fcf6e]" />
                <span>Baixar para Android (APK)</span>
              </a>
            </div>
          </div>

          {/* Device Mockup Decorator (Emoji 📱 em círculo branco) */}
          <div className="relative z-10 hidden md:flex items-center justify-center w-36 h-36 bg-white rounded-full border border-[#dde8d5]/40 shadow-xs text-6xl flex-shrink-0">
            📱
          </div>

        </div>
      </div>
    </section>
  );
}
