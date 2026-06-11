import { Download } from 'lucide-react';

export function AppCTA() {
  return (
    <section id="app-cta" className="py-10 px-6 bg-transparent">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-2xl p-8 md:p-12 border border-forest-200 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden text-left shadow-xs">
          
          {/* Text Content */}
          <div className="space-y-4 max-w-lg relative z-10">
            <h3 className="text-2xl md:text-3xl font-extrabold text-forest-900">
              Quer coletar em campo?
            </h3>
            <p className="text-sm md:text-base text-neutral-700 leading-relaxed font-medium">
              Baixe o aplicativo oficial do Veridia Saber para cadastrar ocorrências ecológicas, registrar imagens e gerenciar coleções físicas mesmo estando sem conexão de internet (100% offline).
            </p>
            <div className="pt-2">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-forest-900 hover:bg-forest-800 text-white font-bold rounded-full shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-sm"
              >
                <Download className="w-4 h-4 text-forest-400" />
                <span>Baixar para Android (APK)</span>
              </a>
            </div>
          </div>

          {/* Device Mockup Decorator (Emoji 📱 em círculo branco) */}
          <div className="relative z-10 hidden md:flex items-center justify-center w-36 h-36 bg-white rounded-full border border-forest-200/40 shadow-xs text-6xl flex-shrink-0">
            📱
          </div>

        </div>
      </div>
    </section>
  );
}
