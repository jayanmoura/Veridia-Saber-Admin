import { Link } from 'react-router-dom';
import icon from '../../../assets/icon.png';

export function Footer() {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const adminUrl = isLocalhost ? '/login' : 'https://painel-admin.veridiasaber.com.br';

  return (
    <footer className="bg-forest-950 border-t border-white/[0.06] py-6 px-6">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Esquerda: Logo e Marca */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0">
          <img src={icon} alt="Veridia Saber" className="h-6 w-6 object-contain" />
          <span className="text-sm font-medium text-white">Veridia Saber</span>
        </Link>

        {/* Centro: Links Inline */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-forest-600 font-normal">
          <Link to="/privacidade" className="hover:text-forest-400 transition-colors">Privacidade</Link>
          <span>·</span>
          <Link to="/termos" className="hover:text-forest-400 transition-colors">Termos</Link>
          <span>·</span>
          <Link to="/isencao" className="hover:text-forest-400 transition-colors">Isenção</Link>
          <span>·</span>
          <a
            href={adminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-forest-400 transition-colors inline-flex items-center gap-0.5"
          >
            <span>Admin</span>
            <span className="text-[10px]">↗</span>
          </a>
        </div>

        {/* Direita: Assinatura */}
        <span className="text-xs text-forest-600/70 font-normal flex-shrink-0">
          &copy; 2026 Veridia Saber
        </span>

      </div>
    </footer>
  );
}
