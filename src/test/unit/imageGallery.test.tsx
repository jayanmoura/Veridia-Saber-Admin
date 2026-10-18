import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageGallery, type GalleryImage } from '../../pages/landingpage/components/ImageGallery';

function createMockImages(count: number): GalleryImage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${i + 1}`,
    url_imagem: `https://storage.veridiasaber.com.br/fotos/planta-${i + 1}.jpg`,
    url_thumbnail: `https://storage.veridiasaber.com.br/thumbs/planta-${i + 1}.jpg`,
    url_micro: `https://storage.veridiasaber.com.br/micro/planta-${i + 1}.jpg`,
    creditos: `Fotógrafo ${i + 1}`,
    alt: `Foto botânica ${i + 1}`
  }));
}

describe('ImageGallery - Galeria Única e Lightbox', () => {
  it('renderiza no máximo 8 miniaturas por página', () => {
    const images = createMockImages(12);
    render(<ImageGallery images={images} />);

    const renderedImages = screen.getAllByRole('img');
    expect(renderedImages).toHaveLength(8);
    expect(renderedImages[0]).toHaveAttribute('src', images[0].url_thumbnail);
    expect(renderedImages[7]).toHaveAttribute('src', images[7].url_thumbnail);
  });

  it('esconde os botões de paginação quando houver 8 imagens ou menos', () => {
    const images = createMockImages(8);
    render(<ImageGallery images={images} />);

    expect(screen.queryByRole('button', { name: /página anterior/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /próxima página/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/página 1 de/i)).not.toBeInTheDocument();
  });

  it('troca de página corretamente ao clicar em Próxima e Anterior', () => {
    const images = createMockImages(10);
    render(<ImageGallery images={images} />);

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /página anterior/i })).toBeDisabled();

    // Avança para a página 2
    const proximaBtn = screen.getByRole('button', { name: /próxima página/i });
    expect(proximaBtn).not.toBeDisabled();
    fireEvent.click(proximaBtn);

    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    const renderedImages = screen.getAllByRole('img');
    expect(renderedImages).toHaveLength(2);
    expect(renderedImages[0]).toHaveAttribute('src', images[8].url_thumbnail);
    expect(renderedImages[1]).toHaveAttribute('src', images[9].url_thumbnail);
    expect(screen.getByRole('button', { name: /próxima página/i })).toBeDisabled();

    // Volta para a página 1
    const anteriorBtn = screen.getByRole('button', { name: /página anterior/i });
    expect(anteriorBtn).not.toBeDisabled();
    fireEvent.click(anteriorBtn);

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(8);
  });

  it('abre o lightbox exibindo url_imagem ao clicar em uma miniatura e permite fechar', () => {
    const images = createMockImages(3);
    render(<ImageGallery images={images} />);

    const thumbnails = screen.getAllByRole('img');
    fireEvent.click(thumbnails[1]); // clica na segunda foto

    // Lightbox aberto via createPortal
    const fecharBtn = screen.getByRole('button', { name: /fechar galeria/i });
    expect(fecharBtn).toBeInTheDocument();

    // Procura imagem ampliada pelo atributo src correspondente à url_imagem
    const expandedImg = screen.getAllByRole('img').find(img => img.getAttribute('src') === images[1].url_imagem);
    expect(expandedImg).toBeDefined();
    expect(screen.getByText('Fotógrafo 2')).toBeInTheDocument();

    // Fecha o modal
    fireEvent.click(fecharBtn);
    expect(screen.queryByRole('button', { name: /fechar galeria/i })).not.toBeInTheDocument();
  });

  it('reseta para a primeira página quando a lista de imagens muda', () => {
    const initialImages = createMockImages(10);
    const { rerender } = render(<ImageGallery images={initialImages} />);

    fireEvent.click(screen.getByRole('button', { name: /próxima página/i }));
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();

    const newImages = createMockImages(12);
    rerender(<ImageGallery images={newImages} />);

    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
  });
});
