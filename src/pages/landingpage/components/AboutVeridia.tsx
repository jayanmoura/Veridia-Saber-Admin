import { useNavigate } from 'react-router-dom';

export function AboutVeridia() {
  const navigate = useNavigate();

  return (
    <section className="py-10 px-6 bg-transparent text-stone-800">
      <div className="container mx-auto max-w-6xl space-y-8">
        
        {/* Cabeçalho da Seção */}
        <div className="text-left pb-4 border-b border-[#dde8d5]">
          <span className="text-[#4a7c5a] text-xs font-bold uppercase tracking-widest block mb-2">
            O QUE É O VERIDIA SABER
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a3a1f]">
            Uma ponte entre a tecnologia e a natureza
          </h2>
        </div>
 
        {/* Conteúdo em Duas Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start text-left">
          
          {/* Coluna Esquerda: Texto */}
          <div className="space-y-6">
            <p className="leading-relaxed text-[#4a5a44] text-base font-normal">
              O <span className="font-semibold text-[#1a3a1f]">Veridia Saber</span> é uma ponte. Uma ponte que liga o entusiasta ao cientista, o curioso ao pesquisador e, todos nós, à biodiversidade incrível que nos rodeia. A tecnologia a serviço do conhecimento e da natureza!
            </p>
            <p className="leading-relaxed text-[#4a5a44] text-base font-normal">
              Desenvolvimento para auxiliar no estudo e catalogação da biodiversidade brasileira, o aplicativo permite identificar espécies, registrar ocorrências e manter coleções organizadas - mesmo em áreas sem conexão.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/criador')}
                className="px-6 py-2 border-2 border-[#1a3a1f] text-[#1a3a1f] hover:bg-[#1a3a1f]/5 font-bold rounded-full transition-all duration-300 active:scale-98 cursor-pointer text-sm inline-flex items-center"
              >
                Conheça o Criador →
              </button>
            </div>
          </div>
 
          {/* Coluna Direita: Card de Info */}
          <div className="bg-white rounded-2xl border border-[#dde8d5] p-6 shadow-xs">
            <div className="space-y-1">
              
              {/* Linha 1 */}
              <div className="flex justify-between items-center py-3 border-b border-[#dde8d5]">
                <span className="text-sm text-[#7a9a7a] font-semibold">Início</span>
                <span className="text-sm font-medium text-[#4a7c5a]">2025</span>
              </div>

              {/* Linha 2 */}
              <div className="flex justify-between items-center py-3 border-b border-[#dde8d5]">
                <span className="text-sm text-[#7a9a7a] font-semibold">Foco</span>
                <span className="text-sm font-medium text-[#4a7c5a]">Offline-First</span>
              </div>

              {/* Linha 3 */}
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-[#7a9a7a] font-semibold">Domínio</span>
                <span className="text-sm font-medium text-[#4a7c5a]">Biodiversidade</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
