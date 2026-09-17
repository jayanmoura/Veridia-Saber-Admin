import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Contrast } from 'lucide-react';
import icon from '../../../assets/icon.png';

export function Navbar() {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const adminUrl = isLocalhost ? '/login' : 'https://painel-admin.veridiasaber.com.br';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('veridia-contrast') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('contrast');
    } else {
      root.classList.remove('contrast');
    }
    localStorage.setItem('veridia-contrast', String(highContrast));
  }, [highContrast]);

  const toggleContrast = () => {
    setHighContrast(prev => !prev);
  };

  const enterBtnClass = 'inline-flex items-center justify-center font-bold text-white rounded-full bg-forest-900 hover:bg-forest-800 border border-transparent transition-all duration-200 cursor-pointer shadow-xs';

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-forest-200 px-6">
      <div className="container mx-auto max-w-6xl py-4 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src={icon} alt="Veridia Saber" className="h-8 w-8 object-contain" />
          <span className="text-xl tracking-tight flex items-center">
            <span className="font-bold text-forest-900">Veridia</span>
            <span className="font-normal text-forest-600 ml-1">Saber</span>
          </span>
        </Link>

        {/* Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-forest-600">
          
          {/* Dropdown Acervo Botânico */}
          <div className="relative group py-2">
            <button className="hover:text-forest-900 transition-colors flex items-center gap-1 cursor-pointer font-semibold text-forest-600 bg-transparent border-none outline-none">
              <span>Acervo Botânico</span>
              <span className="text-[10px] transform group-hover:rotate-180 transition-transform duration-200">▼</span>
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 mt-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 bg-white border border-forest-200 rounded-xl shadow-lg min-w-[160px] py-1.5 z-50 transition-all duration-200">
              <Link
                to="/familias-catalogo"
                className="block px-4 py-2.5 hover:bg-forest-50 text-forest-900 hover:text-forest-900 transition-colors text-xs font-semibold"
              >
                Famílias
              </Link>
              <Link
                to="/catalogo"
                className="block px-4 py-2.5 hover:bg-forest-50 text-forest-900 hover:text-forest-900 transition-colors text-xs font-semibold"
              >
                Espécies
              </Link>
            </div>
          </div>

          <Link to="/locais-publico" className="hover:text-forest-900 transition-colors">Locais</Link>
          <Link to="/morfologia" className="hover:text-forest-900 transition-colors">Morfologia</Link>
          <Link to="/sobre" className="hover:text-forest-900 transition-colors">Sobre</Link>

          {/* Botões de Alto Contraste e Entrar (Desktop) */}
          <div className="flex items-center gap-3 pl-4 border-l border-forest-200 ml-2">
            <button
              onClick={toggleContrast}
              className={`p-1.5 rounded-full transition-colors border ${
                highContrast
                  ? 'bg-forest-900 text-white border-forest-900'
                  : 'hover:bg-forest-50 text-forest-600 hover:text-forest-900 border-transparent hover:border-forest-200'
              }`}
              title="Alto Contraste"
              aria-label="Alternar alto contraste"
            >
              <Contrast className="w-4 h-4" />
            </button>

            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3.5 py-1.5 text-xs ${enterBtnClass} ml-1`}
            >
              Entrar
            </a>
          </div>
        </div>

        {/* Controles Mobile */}
        <div className="md:hidden flex items-center gap-2">
          <a
            href={adminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3 py-1.5 text-xs ${enterBtnClass}`}
          >
            Entrar
          </a>

          {/* Menu Hamburguer (Mobile) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 text-forest-900 hover:bg-forest-50 rounded-lg transition-colors cursor-pointer"
            aria-label="Alternar menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu Drawer/Dropdown (Mobile) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-forest-200 -mx-6 px-6 py-4 shadow-md animate-fade-in">
          <div className="flex flex-col gap-3 font-semibold text-forest-600">
            <div className="text-xs uppercase tracking-widest text-forest-600/60 font-bold pt-1">Acervo Botânico</div>
            <Link to="/familias-catalogo" onClick={() => setIsMenuOpen(false)} className="hover:text-forest-900 py-1 pl-3 border-l-2 border-forest-400/30">Famílias</Link>
            <Link to="/catalogo" onClick={() => setIsMenuOpen(false)} className="hover:text-forest-900 py-1 pl-3 border-l-2 border-forest-400/30">Espécies</Link>
            <div className="border-t border-forest-200 my-1"></div>
            <Link to="/locais-publico" onClick={() => setIsMenuOpen(false)} className="hover:text-forest-900 py-1">Locais</Link>
            <Link to="/morfologia" onClick={() => setIsMenuOpen(false)} className="hover:text-forest-900 py-1">Morfologia</Link>
            <Link to="/sobre" onClick={() => setIsMenuOpen(false)} className="hover:text-forest-900 py-1">Sobre</Link>

            {/* Acessibilidade - Alto Contraste (Mobile) */}
            <div className="border-t border-forest-200 my-1 pt-3 flex items-center justify-between gap-4">
              <span className="text-xs uppercase tracking-widest text-forest-600/60 font-bold">Acessibilidade</span>
              <button
                onClick={() => {
                  toggleContrast();
                  setIsMenuOpen(false);
                }}
                className={`p-2 rounded-full transition-colors border ${
                  highContrast
                    ? 'bg-forest-900 text-white border-forest-900'
                    : 'hover:bg-forest-50 text-forest-600 hover:text-forest-900 border-forest-200'
                }`}
                aria-label="Alternar alto contraste"
              >
                <Contrast className="w-4 h-4" />
              </button>
            </div>

            {/* Link Entrar (Mobile Drawer) */}
            <div className="border-t border-forest-200 pt-3">
              <a
                href={adminUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className={`w-full py-2.5 px-4 text-xs ${enterBtnClass}`}
              >
                Entrar
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
