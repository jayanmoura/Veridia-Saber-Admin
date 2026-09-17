import { Link } from 'react-router-dom';
import icon from '../../../assets/icon.png';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-forest-950 border-t border-forest-900 text-neutral-100">
      <div className="container mx-auto max-w-6xl px-6 pt-12 pb-8 md:pt-14 md:pb-8">
        {/* Grid de 4 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10">
          
          {/* Coluna 1: Marca */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src={icon} alt="Veridia Saber" className="h-7 w-7 object-contain" />
              <span className="text-base font-semibold text-white">Veridia Saber</span>
            </Link>
            <p className="text-sm text-forest-400 leading-relaxed">
              Plataforma de gestão de acervos botânicos para jardins botânicos, herbários e centros de pesquisa.
            </p>
          </div>

          {/* Coluna 2: Acervo Botânico */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-forest-200">
              Acervo Botânico
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/catalogo" className="text-forest-400 hover:text-white transition-colors">
                  Espécies
                </Link>
              </li>
              <li>
                <Link to="/familias-catalogo" className="text-forest-400 hover:text-white transition-colors">
                  Famílias
                </Link>
              </li>
              <li>
                <Link to="/locais-publico" className="text-forest-400 hover:text-white transition-colors">
                  Locais
                </Link>
              </li>
              <li>
                <Link to="/morfologia" className="text-forest-400 hover:text-white transition-colors">
                  Morfologia
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Institucional */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-forest-200">
              Institucional
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/sobre" className="text-forest-400 hover:text-white transition-colors">
                  Sobre
                </Link>
              </li>
              <li>
                <Link to="/criador" className="text-forest-400 hover:text-white transition-colors">
                  Criador
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-forest-200">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/privacidade" className="text-forest-400 hover:text-white transition-colors">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link to="/termos" className="text-forest-400 hover:text-white transition-colors">
                  Termos
                </Link>
              </li>
              <li>
                <Link to="/isencao" className="text-forest-400 hover:text-white transition-colors">
                  Isenção
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Linha de copyright integrada e sutil */}
        <div className="mt-10 pt-6 border-t border-forest-800/50 flex items-center justify-between text-xs text-forest-400/80 font-normal">
          <p>&copy; {currentYear} Veridia Saber</p>
        </div>
      </div>
    </footer>
  );
}
