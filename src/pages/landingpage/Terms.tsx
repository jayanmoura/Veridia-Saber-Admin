import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { LegalPageLayout } from './components/LegalPageLayout';

export default function Terms() {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalPageLayout
      title="Termos de Uso"
      tag="Termos"
      updatedAt="Última atualização: Janeiro de 2026"
    >
      <p className="text-neutral-700 leading-relaxed">
        Ao baixar ou usar o aplicativo Veridia Saber, você concorda automaticamente com estes termos.
      </p>

      <h2 className="text-lg font-semibold text-forest-900 mt-8 mb-3">1. Uso do Aplicativo</h2>
      <p className="text-neutral-700 leading-relaxed">
        O Veridia Saber é uma ferramenta educacional e de auxílio à pesquisa de campo. Você concorda em usar o aplicativo apenas para fins legais e éticos.
      </p>

      <h2 className="text-lg font-semibold text-forest-900 mt-8 mb-3">2. Isenção de Responsabilidade</h2>

      {/* Warning Alert */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg text-left">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-bold text-amber-800 mb-2">Importante!</p>
            <p className="text-amber-700 text-sm leading-relaxed">
              O aplicativo NÃO deve ser usado como única fonte para determinar se uma planta é comestível, medicinal ou tóxica. O desenvolvedor não se responsabiliza por quaisquer danos à saúde, envenenamentos ou prejuízos causados pelo uso incorreto das informações contidas no aplicativo. <strong className="font-bold">Consulte sempre um especialista.</strong>
            </p>
          </div>
        </div>
      </div>

      <ul className="list-disc pl-5 space-y-4 text-neutral-700">
        <li className="marker:text-forest-400">
          <strong className="text-forest-900 font-semibold">Identificação de Espécies:</strong> O Veridia Saber fornece ferramentas para auxiliar na identificação de plantas, mas não garante 100% de precisão. A identificação botânica é complexa e sujeita a erros.
        </li>
        <li className="marker:text-forest-400">
          <strong className="text-forest-900 font-semibold">Segurança e Saúde:</strong> O aplicativo NÃO deve ser usado como única fonte para determinar se uma planta é comestível, medicinal ou tóxica.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-forest-900 mt-8 mb-3">3. Propriedade Intelectual</h2>
      <p className="text-neutral-700 leading-relaxed">
        Todo o código, design e marca "Veridia Saber" são propriedade intelectual do desenvolvedor. Você não tem permissão para copiar, modificar ou fazer engenharia reversa do aplicativo.
      </p>

      <h2 className="text-lg font-semibold text-forest-900 mt-8 mb-3">4. Conteúdo do Usuário</h2>
      <p className="text-neutral-700 leading-relaxed">
        Você é responsável pelas fotos e informações que cadastra no aplicativo. Não envie conteúdo ofensivo, ilegal ou que viole direitos autorais de terceiros.
      </p>

      <h2 className="text-lg font-semibold text-forest-900 mt-8 mb-3">5. Alterações nos Termos</h2>
      <p className="text-neutral-700 leading-relaxed">
        Podemos atualizar estes termos periodicamente. Recomendamos que você revise esta página regularmente.
      </p>
    </LegalPageLayout>
  );
}
