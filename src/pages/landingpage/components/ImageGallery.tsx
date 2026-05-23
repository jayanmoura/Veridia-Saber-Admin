import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export interface GalleryImage {
  id: string;
  url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  species_name?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
}

/**
 * ImageGallery - Grid de imagens botânicas com suporte a Lightbox (via createPortal)
 */
export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const showNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % images.length);
  };

  const showPrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
  };

  return (
    <>
      {/* Grid de Imagens */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id || index}
            onClick={() => openLightbox(index)}
            className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-stone-100 border border-emerald-950/[0.04] shadow-xs"
          >
            {/* Imagem */}
            <img
              src={image.thumbnail_url || image.url}
              alt={image.caption || image.species_name || 'Foto botânica'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />

            {/* Overlay Hover */}
            <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="p-3 bg-white/20 backdrop-blur-xs rounded-full text-white transform scale-90 group-hover:scale-100 transition-transform duration-300">
                <Maximize2 className="w-5 h-5" />
              </div>
            </div>

            {/* Nome da espécie no rodapé da imagem (se disponível) */}
            {image.species_name && (
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 via-black/35 to-transparent text-left pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                  {image.species_name}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal (Portal) */}
      {selectedIndex !== null && (
        <LightboxPortal
          images={images}
          currentIndex={selectedIndex}
          onClose={closeLightbox}
          onNext={showNext}
          onPrev={showPrev}
        />
      )}
    </>
  );
}

interface LightboxPortalProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function LightboxPortal({ images, currentIndex, onClose, onNext, onPrev }: LightboxPortalProps) {
  const currentImage = images[currentIndex];

  // Atalhos de teclado (Esc, Setas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Bloquear scroll do body quando aberto
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, onNext, onPrev]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in">
      {/* Botão de Fechar */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer"
        aria-label="Fechar galeria"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Botões de Navegação */}
      {images.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 lg:left-8 z-10 p-3 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all cursor-pointer"
            aria-label="Imagem anterior"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          <button
            onClick={onNext}
            className="absolute right-4 lg:right-8 z-10 p-3 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all cursor-pointer"
            aria-label="Próxima imagem"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </>
      )}

      {/* Conteúdo Principal da Imagem */}
      <div className="max-w-5xl max-h-[80vh] px-4 flex flex-col items-center">
        <div className="relative overflow-hidden rounded-xl shadow-2xl">
          <img
            src={currentImage.url}
            alt={currentImage.caption || currentImage.species_name || 'Foto ampliada'}
            className="max-w-full max-h-[70vh] object-contain mx-auto"
          />
        </div>

        {/* Rodapé do Lightbox com Legendas */}
        {(currentImage.species_name || currentImage.caption) && (
          <div className="mt-4 text-center text-white max-w-2xl px-4">
            {currentImage.species_name && (
              <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400 font-serif italic">
                {currentImage.species_name}
              </h4>
            )}
            {currentImage.caption && (
              <p className="text-xs lg:text-sm text-stone-300 mt-1 leading-relaxed">
                {currentImage.caption}
              </p>
            )}
          </div>
        )}

        {/* Indicador de Página/Contador */}
        {images.length > 1 && (
          <div className="absolute bottom-6 px-4 py-1.5 bg-white/5 rounded-full text-xs font-semibold tracking-wider text-stone-400">
            {currentIndex + 1} de {images.length}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
