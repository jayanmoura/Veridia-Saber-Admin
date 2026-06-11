import { useEffect } from 'react';
import { LegalPageLayout } from './components/LegalPageLayout';

export default function Privacy() {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalPageLayout
      title="Política de Privacidade"
      tag="Privacidade"
      updatedAt="Última atualização: Janeiro de 2026"
    >
      <p className="text-neutral-700 leading-relaxed">
        O Veridia Saber ("nós", "nosso") preza pela sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações ao utilizar nosso aplicativo móvel.
      </p>

      <h2 className="text-lg font-semibold text-forest-900 mt-8 mb-3">1. Informações que Coletamos</h2>
      <p className="text-neutral-700 leading-relaxed mb-4">
        Para o funcionamento correto do aplicativo, solicitamos as seguintes permissões e dados:
      </p>
      <ul className="list-disc pl-5 space-y-4 text-neutral-700">
        <li className="marker:text-forest-400">
          <strong className="text-forest-900 font-semibold">Acesso à Galeria/Arquivos:</strong> Necessário para que você possa fazer upload de fotos de plantas e espécimes para catalogação dentro dos seus projetos. As fotos ficam salvas no nosso banco de dados seguro quando sincronizadas.
        </li>
        <li className="marker:text-forest-400">
          <strong className="text-forest-900 font-semibold">Localização (GPS):</strong> Coletamos dados de localização precisos (apenas quando o app está em uso) para georreferenciar as coletas botânicas no mapa. Isso permite que você saiba exatamente onde uma planta foi encontrada.
        </li>
        <li className="marker:text-forest-400">
          <strong className="text-forest-900 font-semibold">Dados da Conta:</strong> Coletamos seu nome e e-mail para criação de conta e sincronização de dados entre dispositivos.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-forest-900 mt-8 mb-3">2. Como Usamos Seus Dados</h2>
      <ul className="list-disc pl-5 space-y-4 text-neutral-700">
        <li className="marker:text-forest-400">
          <strong className="text-forest-900 font-semibold">Funcionamento:</strong> Para permitir a criação de coleções, identificação de espécies e mapeamento de flora.
        </li>
        <li className="marker:text-forest-400">
          <strong className="text-forest-900 font-semibold">Sincronização:</strong> Para salvar seu progresso na nuvem (via Supabase), garantindo que você não perca dados se trocar de celular.
        </li>
        <li className="marker:text-forest-400">
          <strong className="text-forest-900 font-semibold">Melhorias:</strong> Podemos usar dados anônimos para corrigir erros (crashes) e melhorar a performance do app.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-forest-900 mt-8 mb-3">3. Compartilhamento de Dados</h2>
      <p className="text-neutral-700 leading-relaxed">
        Nós <strong className="text-forest-900 font-semibold">não vendemos</strong> seus dados pessoais para terceiros. Seus dados são armazenados em serviços de nuvem seguros (Supabase) necessários para a operação do aplicativo.
      </p>

      <h2 className="text-lg font-semibold text-forest-900 mt-8 mb-3">4. Seus Direitos (LGPD)</h2>
      <p className="text-neutral-700 leading-relaxed">
        Você tem o direito de solicitar a exclusão completa da sua conta e de todos os dados associados a qualquer momento entrando em contato conosco.
      </p>

      <h2 className="text-lg font-semibold text-forest-900 mt-8 mb-3">5. Coleta de Dados e Analytics</h2>
      <p className="text-neutral-700 leading-relaxed mb-4">
        O Veridia Saber coleta dados anônimos de uso do aplicativo para melhorar a experiência do usuário. Os dados coletados incluem:
      </p>
      <ul className="list-disc pl-5 space-y-3 text-neutral-700 mb-4">
        <li className="marker:text-forest-400">
          <strong className="text-forest-900 font-semibold">Eventos de uso:</strong> login, logout, criação de coleções, adição de plantas
        </li>
        <li className="marker:text-forest-400">
          <strong className="text-forest-900 font-semibold">Localização:</strong> apenas quando você adiciona uma planta com geolocalização
        </li>
        <li className="marker:text-forest-400">
          <strong className="text-forest-900 font-semibold">Imagens:</strong> fotos de plantas que você captura
        </li>
      </ul>
      <p className="text-neutral-700 leading-relaxed mb-4">
        <strong className="text-forest-900 font-semibold">Não coletamos dados pessoais sensíveis.</strong> Todos os dados são transmitidos de forma criptografada (HTTPS) e os dados de analytics são automaticamente excluídos após 90 dias.
      </p>
      <p className="text-neutral-700 leading-relaxed">
        O aplicativo está em conformidade com a <strong className="text-forest-900 font-semibold">LGPD (Lei Geral de Proteção de Dados)</strong>. Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail{' '}
        <a href="mailto:suporte@veridiasaber.com" className="text-forest-400 hover:text-forest-600 underline font-medium">
          suporte@veridiasaber.com
        </a>.
      </p>

      <h2 className="text-lg font-semibold text-forest-900 mt-8 mb-3">6. Contato</h2>
      <p className="text-neutral-700 leading-relaxed">
        Se tiver dúvidas sobre esta política, entre em contato:{' '}
        <a href="mailto:contatos@veridiasaber.com.br" className="text-forest-400 hover:text-forest-600 underline font-medium">
          contatos@veridiasaber.com.br
        </a>
      </p>
    </LegalPageLayout>
  );
}
