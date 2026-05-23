import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon, Contrast } from 'lucide-react';
import icon from '../../../assets/icon.png';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('veridia-theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('veridia-contrast') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('veridia-theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('contrast');
    } else {
      root.classList.remove('contrast');
    }
    localStorage.setItem('veridia-contrast', String(highContrast));
  }, [highContrast]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleContrast = () => {
    setHighContrast(prev => !prev);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#dde8d5] px-6">
      <div className="container mx-auto max-w-6xl py-4 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src={icon} alt="Veridia Saber" className="h-8 w-8 object-contain" />
          <span className="text-xl tracking-tight flex items-center">
            <span className="font-bold text-[#1a3a1f]">Veridia</span>
            <span className="font-normal text-[#4a7c5a] ml-1">Saber</span>
          </span>
        </Link>

        {/* Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#4a7c5a]">
          
          {/* Dropdown Acervo Botânico */}
          <div className="relative group py-2">
            <button className="hover:text-[#1a3a1f] transition-colors flex items-center gap-1 cursor-pointer font-semibold text-[#4a7c5a] bg-transparent border-none outline-none">
              <span>Acervo Botânico</span>
              <span className="text-[10px] transform group-hover:rotate-180 transition-transform duration-200">▼</span>
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 mt-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 bg-white border border-[#dde8d5] rounded-xl shadow-lg min-w-[160px] py-1.5 z-50 transition-all duration-200">
              <Link
                to="/familias-catalogo"
                className="block px-4 py-2.5 hover:bg-[#f0f5ee] text-[#1a3a1f] hover:text-[#1a3a1f] transition-colors text-xs font-semibold"
              >
                Famílias
              </Link>
              <Link
                to="/catalogo"
                className="block px-4 py-2.5 hover:bg-[#f0f5ee] text-[#1a3a1f] hover:text-[#1a3a1f] transition-colors text-xs font-semibold"
              >
                Espécies
              </Link>
            </div>
          </div>

          <Link to="/locais-publico" className="hover:text-[#1a3a1f] transition-colors">Locais</Link>
          <Link to="/morfologia" className="hover:text-[#1a3a1f] transition-colors">Morfologia</Link>
          <Link to="/sobre" className="hover:text-[#1a3a1f] transition-colors">Sobre</Link>

          {/* Botões de Acessibilidade e Tema (Desktop) */}
          <div className="flex items-center gap-3 pl-4 border-l border-[#dde8d5] ml-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 hover:bg-[#f0f5ee] rounded-full text-[#4a7c5a] hover:text-[#1a3a1f] transition-colors cursor-pointer border border-transparent hover:border-[#dde8d5]"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Noturno'}
              aria-label="Alternar modo noturno"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleContrast}
              className={`p-1.5 rounded-full transition-colors border ${
                highContrast
                  ? 'bg-[#1a3a1f] text-white border-[#1a3a1f]'
                  : 'hover:bg-[#f0f5ee] text-[#4a7c5a] hover:text-[#1a3a1f] border-transparent hover:border-[#dde8d5]'
              }`}
              title="Alto Contraste"
              aria-label="Alternar alto contraste"
            >
              <Contrast className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Menu Hamburguer (Mobile) */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-1 text-[#1a3a1f] hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
          aria-label="Alternar menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Menu Drawer/Dropdown (Mobile) */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#dde8d5] -mx-6 px-6 py-4 shadow-md animate-fade-in">
          <div className="flex flex-col gap-3 font-semibold text-[#4a7c5a]">
            <div className="text-xs uppercase tracking-widest text-[#4a7c5a]/60 font-bold pt-1">Acervo Botânico</div>
            <Link to="/familias-catalogo" onClick={() => setIsMenuOpen(false)} className="hover:text-[#1a3a1f] py-1 pl-3 border-l-2 border-[#5fcf6e]/30">Famílias</Link>
            <Link to="/catalogo" onClick={() => setIsMenuOpen(false)} className="hover:text-[#1a3a1f] py-1 pl-3 border-l-2 border-[#5fcf6e]/30">Espécies</Link>
            <div className="border-t border-stone-100 my-1"></div>
            <Link to="/locais-publico" onClick={() => setIsMenuOpen(false)} className="hover:text-[#1a3a1f] py-1">Locais</Link>
            <Link to="/morfologia" onClick={() => setIsMenuOpen(false)} className="hover:text-[#1a3a1f] py-1">Morfologia</Link>
            <Link to="/sobre" onClick={() => setIsMenuOpen(false)} className="hover:text-[#1a3a1f] py-1">Sobre</Link>

            {/* Acessibilidade e Tema (Mobile) */}
            <div className="border-t border-stone-100 my-1 pt-3 flex items-center justify-between gap-4">
              <span className="text-xs uppercase tracking-widest text-[#4a7c5a]/60 font-bold">Acessibilidade</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsMenuOpen(false);
                  }}
                  className="p-2 hover:bg-[#f0f5ee] rounded-full text-[#4a7c5a] hover:text-[#1a3a1f] transition-colors border border-[#dde8d5]"
                  aria-label="Alternar modo noturno"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    toggleContrast();
                    setIsMenuOpen(false);
                  }}
                  className={`p-2 rounded-full transition-colors border ${
                    highContrast
                      ? 'bg-[#1a3a1f] text-white border-[#1a3a1f]'
                      : 'hover:bg-[#f0f5ee] text-[#4a7c5a] hover:text-[#1a3a1f] border-[#dde8d5]'
                  }`}
                  aria-label="Alternar alto contraste"
                >
                  <Contrast className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
