import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock compressImage so tests don't hang waiting for Canvas/Image APIs that
// jsdom doesn't implement (HTMLCanvasElement.toBlob, blob: URL loading).
vi.mock('../utils/imageCompressor', () => ({
    compressImage: vi.fn(async (file: File) =>
        new File(['thumb'], `thumb_${file.name.replace(/\.[^.]+$/, '.jpg')}`, { type: 'image/jpeg' })
    ),
    compressForListing: vi.fn(async (file: File) =>
        new File(['micro'], `thumb_${file.name.replace(/\.[^.]+$/, '.jpg')}`, { type: 'image/jpeg' })
    ),
}));
