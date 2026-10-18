import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Leaf } from 'lucide-react';
import type { ImagemRow } from '../../../types/db';

export interface GalleryImage {
  id?: ImagemRow['id'] | number;
  url_imagem?: ImagemRow['url_imagem'] | null;
  url_thumbnail?: ImagemRow['url_thumbnail'];
  url_micro?: ImagemRow['url_micro'];
  creditos?: ImagemRow['creditos'];
  alt?: string; // derivado no front
}

export interface ImageGalleryProps {
  images: GalleryImage[];
  title?: string;
  badgeUnit?: { singular: string; plural: string };
  defaultAlt?: string;
  emptyMessage?: string;
}

const ITEMS_PER_PAGE = 8;

export function ImageGallery({
  images,
  title,
  badgeUnit = { singular: 'foto', plural: 'fotos' },
  defaultAlt = 'Foto botânica',
  emptyMessage
}: ImageGalleryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [prevImages, setPrevImages] = useState(images);

  // Reseta para a primeira página sempre que a lista de imagens for alterada
  if (images !== prevImages) {
    setPrevImages(images);
    setCurrentPage(1);
  }

  // Teclas de atalho e scroll lock para o Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [lightboxIndex, images.length]);

  if (!images || images.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-forest-200 shadow-xs flex flex-col items-center justify-center">
        <Leaf size={40} className="text-neutral-300 mb-2 animate-pulse" />
        <p className="text-sm text-neutral-500 italic">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const totalPaginas = Math.ceil(images.length / ITEMS_PER_PAGE) || 1;
  const inicio = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginadas = images.slice(inicio, inicio + ITEMS_PER_PAGE);

  return (
    <>
      {title && (
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-xl font-bold text-forest-900">
            {title}
          </h2>
          <span className="inline-flex px-2.5 py-1 bg-forest-100 border border-forest-200 text-forest-600 text-xs font-bold rounded-lg">
            {images.length} {images.length === 1 ? badgeUnit.singular : badgeUnit.plural}
          </span>
        </div>
      )}

      {/* Grid de Imagens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {paginadas.map((img, idx) => {
          const miniatura = img.url_thumbnail || img.url_micro || img.url_imagem;
          const globalIndex = inicio + idx;
          return (
            <div
              key={img.id ?? globalIndex}
              className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-forest-200 bg-stone-50 hover:brightness-90 transition duration-300"
              onClick={() => setLightboxIndex(globalIndex)}
            >
              <img
                src={miniatura || undefined}
                alt={img.alt || defaultAlt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          );
        })}
      </div>

      {/* Paginação: escondida quando houver 8 imagens ou menos */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3.5 py-1.5 rounded-lg border border-forest-200 bg-white text-forest-900 text-sm font-medium hover:bg-forest-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            aria-label="Página anterior"
          >
            <span>←</span> Anterior
          </button>
          <span className="text-xs font-semibold text-forest-600">
            Página {currentPage} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPaginas))}
            disabled={currentPage === totalPaginas}
            className="px-3.5 py-1.5 rounded-lg border border-forest-200 bg-white text-forest-900 text-sm font-medium hover:bg-forest-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            aria-label="Próxima página"
          >
            Próxima <span>→</span>
          </button>
        </div>
      )}

      {/* Lightbox Modal (Portal z-[100]) */}
      {lightboxIndex !== null && lightboxIndex >= 0 && lightboxIndex < images.length && createPortal(
        <div
          className="fixed inset-0 bg-black/92 flex items-center justify-center z-[100]"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 text-white hover:text-neutral-300 transition-colors p-2 cursor-pointer bg-black/40 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            aria-label="Fechar galeria"
          >
            <X size={28} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center text-3xl font-bold shadow-md cursor-pointer transition-all z-10 select-none border border-white/20"
                aria-label="Imagem anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center text-3xl font-bold shadow-md cursor-pointer transition-all z-10 select-none border border-white/20"
                aria-label="Próxima imagem"
              >
                ›
              </button>
            </>
          )}

          <div
            className="flex flex-col items-center max-w-full max-h-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex].url_imagem || undefined}
              alt={images[lightboxIndex].alt || defaultAlt}
              className="max-h-[80vh] max-w-[85vw] object-contain rounded-lg select-none"
            />
            {images[lightboxIndex].creditos && (
              <div className="w-full mt-3 pt-3 border-t border-white/20 text-center">
                <span className="text-xs text-white/70">
                  {images[lightboxIndex].creditos}
                </span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
