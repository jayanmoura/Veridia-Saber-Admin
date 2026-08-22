import { Leaf } from 'lucide-react';

interface SpecimenPopupCardProps {
  imagemUrl?: string | null;
  nomeCientifico?: string | null;
  nomePopular?: string | null;
  familiaNome?: string | null;
  tombo?: string | null;
  localNome?: string | null;
}

/**
 * Card exibido dentro do <Popup> do Leaflet ao clicar em um ponto de
 * ocorrência (espécime) no mapa. Usado em FamiliesSection (home), DetalhesFamilia,
 * DetalhesEspecie e DetalhesLocal para manter a mesma aparência em todos os
 * mapas do site.
 *
 * Mostra apenas dados públicos e não-sensíveis: nome científico, nome popular
 * (só o primeiro, quando há vários separados por vírgula), família, código do
 * espécime (tombo) e o projeto/instituição ao qual o registro está vinculado.
 */
export function SpecimenPopupCard({
  imagemUrl,
  nomeCientifico,
  nomePopular,
  familiaNome,
  tombo,
  localNome,
}: SpecimenPopupCardProps) {
  const primeiroNomePopular = nomePopular?.split(',')[0]?.trim() || null;

  return (
    <div className="text-left font-sans w-[200px]">
      {/* Foto do espécime */}
      <div className="w-full h-[100px] rounded-lg overflow-hidden mb-2 bg-forest-50">
        {imagemUrl ? (
          <img
            src={imagemUrl}
            alt={nomeCientifico || 'Espécime'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf size={28} className="text-forest-200" />
          </div>
        )}
      </div>

      <div>
        <strong className="italic text-forest-900 text-sm block leading-tight">
          {nomeCientifico || 'Nome não identificado'}
        </strong>
        <span className="italic text-neutral-400 text-xs block mt-0.5">
          {primeiroNomePopular || 'Espécie não identificada'}
        </span>

        <div className="mt-2 space-y-1 text-xs text-neutral-600">
          {familiaNome && (
            <div><strong className="text-forest-900">Família:</strong> {familiaNome}</div>
          )}
          {tombo && (
            <div><strong className="text-forest-900">Espécime:</strong> {tombo}</div>
          )}
          {localNome && (
            <div><strong className="text-forest-900">Projeto vinculado:</strong> {localNome}</div>
          )}
        </div>
      </div>
    </div>
  );
}
