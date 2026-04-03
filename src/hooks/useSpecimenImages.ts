import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { compressImage, compressForListing } from '../utils/imageCompressor';

// ============ TYPES ============
export interface ExistingImage {
    id: string;
    url_imagem: string;
    creditos: string | null;
}

export interface UseSpecimenImagesReturn {
    // State
    imageFiles: File[];
    imagePreviews: string[];
    existingImages: ExistingImage[];
    editedCredits: Record<string, string>;
    newImageCredits: string[];
    dragActive: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;

    // Actions
    handleDrag: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFiles: (files: File[]) => void;
    removeNewImage: (index: number) => void;
    handleDeleteExistingImage: (imageId: string, imageUrl: string) => Promise<void>;
    uploadImages: (specimenId: number, options: UploadOptions) => Promise<{ url: string; credits: string | null; thumbnailUrl: string | null; microUrl: string | null; tamanhoOriginal: number; tamanhoThumbnail: number | null; tamanhoMicro: number | null }[]>;
    loadExistingImages: (specimenId: number) => Promise<void>;
    setEditedCredits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setNewImageCredits: React.Dispatch<React.SetStateAction<string[]>>;
    reset: () => void;
}

export interface UploadOptions {
    localId: number;
    institutionId: string | null;
    onStageChange?: (stage: 'compressing' | 'uploading') => void;
}

/**
 * @description Hook focado em gerenciar imagens exclusivas de espécimes, operando apenas no bucket de arquivos-gerais dos projetos.
 *
 * @returns {UseSpecimenImagesReturn} Gerente filepicker para espécimes:
 *   - `imageFiles`, `imagePreviews` — arquivos em fila client
 *   - `existingImages` — registros vivos de imagens do espécime
 *   - `newImageCredits` — form items de créditos adicionados na foto
 *   - `dragActive` — true se o user der hover de file
 *   - UI Handlers: `handleDrag`, `handleDrop`, `removeNewImage`
 *   - Actions: `uploadImages` (path do specimem), `handleDeleteExistingImage`, `loadExistingImages`
 *
 * @example
 * const { imagePreviews, handleDrop, existingImages } = useSpecimenImages()
 */
export function useSpecimenImages(): UseSpecimenImagesReturn {
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [editedCredits, setEditedCredits] = useState<Record<string, string>>({});
    const [newImageCredits, setNewImageCredits] = useState<string[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Reset all image state
    const reset = useCallback(() => {
        // Revoke object URLs to prevent memory leaks
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setImageFiles([]);
        setImagePreviews([]);
        setNewImageCredits([]);
        setExistingImages([]);
        setEditedCredits({});
    }, [imagePreviews]);

    // Load existing images for a specimen
    const loadExistingImages = useCallback(async (specimenId: number) => {
        // Clear stale images immediately so previous specimen's images don't flash
        setExistingImages([]);
        setEditedCredits({});

        const { data } = await supabase
            .from('imagens')
            .select('id, url_imagem, creditos')
            .eq('especime_id', specimenId);

        if (data) {
            setExistingImages(data.map(img => ({
                id: img.id,
                url_imagem: img.url_imagem,
                creditos: img.creditos || null
            })));

            const credits: Record<string, string> = {};
            data.forEach(img => {
                credits[img.id] = img.creditos || '';
            });
            setEditedCredits(credits);
        }
    }, []);

    // Drag handlers
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    }, []);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    }, []);

    const handleFiles = useCallback((files: File[]) => {
        const imageFilesOnly = files.filter(f => f.type.startsWith('image/'));
        const newPreviews = imageFilesOnly.map(file => URL.createObjectURL(file));
        const defaultCredits = imageFilesOnly.map(() => 'Fotografado por ');

        setImageFiles(prev => [...prev, ...imageFilesOnly]);
        setImagePreviews(prev => [...prev, ...newPreviews]);
        setNewImageCredits(prev => [...prev, ...defaultCredits]);
    }, []);

    const removeNewImage = useCallback((index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
        setNewImageCredits(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Extract storage info from URL
    const extractStorageInfo = (urlStr: string): { bucket: string; path: string } | null => {
        try {
            const url = new URL(urlStr);
            const match = url.pathname.match(/\/arquivos-gerais\/(.+)$/);
            if (match) {
                return { bucket: 'arquivos-gerais', path: match[1] };
            }
            return null;
        } catch {
            // fallback para URL relativa ou malformada
            const match = urlStr.match(/\/arquivos-gerais\/(.+?)(?:\?.*)?$/);
            if (match) {
                return { bucket: 'arquivos-gerais', path: match[1] };
            }
            return null;
        }
    };

    // Delete existing image
    const handleDeleteExistingImage = useCallback(async (imageId: string, imageUrl: string) => {
        try {
            const storageInfo = extractStorageInfo(imageUrl);
            if (storageInfo) {
                await supabase.storage
                    .from(storageInfo.bucket)
                    .remove([storageInfo.path]);
            }

            const { error: dbError } = await supabase
                .from('imagens')
                .delete()
                .eq('id', imageId);

            if (dbError) throw dbError;

            setExistingImages(prev => prev.filter(img => img.id !== imageId));
            setEditedCredits(prev => {
                const updated = { ...prev };
                delete updated[imageId];
                return updated;
            });
        } catch (error: any) {
            console.error('Erro ao excluir imagem:', error);
            alert('Erro ao excluir imagem: ' + (error.message || 'Erro desconhecido'));
        }
    }, []);

    // Upload images
    const uploadImages = useCallback(async (
        specimenId: number,
        options: UploadOptions
    ): Promise<{ url: string; credits: string | null; thumbnailUrl: string | null; microUrl: string | null; tamanhoOriginal: number; tamanhoThumbnail: number | null; tamanhoMicro: number | null }[]> => {
        const results: { url: string; credits: string | null; thumbnailUrl: string | null; microUrl: string | null; tamanhoOriginal: number; tamanhoThumbnail: number | null; tamanhoMicro: number | null }[] = [];

        if (!options.localId) {
            console.error('Local ID missing for specimen upload');
            return [];
        }

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const fileExt = file.name.split('.').pop();
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(7);

            // Path: locais/{localId}/especimes/{specimenId}/{timestamp}_{random}.{ext}
            const bucket = 'arquivos-gerais';
            const filePath = `locais/${options.localId}/especimes/${specimenId}/${timestamp}_${randomSuffix}.${fileExt}`;

            options.onStageChange?.('uploading');
            const { error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (error) {
                console.error('Error uploading file:', error);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            // Generate and upload thumbnails (non-critical)
            const originalSize = file.size;
            let thumbnailUrl: string | null = null;
            let microUrl: string | null = null;
            let thumbSize: number | null = null;
            let microSize: number | null = null;
            try {
                options.onStageChange?.('compressing');
                const dir = filePath.substring(0, filePath.lastIndexOf('/'));
                const base = filePath.substring(filePath.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '.jpg');

                const [thumbFile, microFile] = await Promise.all([
                    compressImage(file),
                    compressForListing(file),
                ]);

                thumbSize = thumbFile.size;
                microSize = microFile.size;

                options.onStageChange?.('uploading');

                const [thumbResult, microResult] = await Promise.all([
                    supabase.storage.from(bucket).upload(`${dir}/thumbs/${base}`, thumbFile, { contentType: 'image/jpeg' }),
                    supabase.storage.from(bucket).upload(`${dir}/micro/${base}`, microFile, { contentType: 'image/jpeg' }),
                ]);

                if (!thumbResult.error) {
                    thumbnailUrl = supabase.storage.from(bucket).getPublicUrl(`${dir}/thumbs/${base}`).data.publicUrl;
                }
                if (!microResult.error) {
                    microUrl = supabase.storage.from(bucket).getPublicUrl(`${dir}/micro/${base}`).data.publicUrl;
                }
            } catch {
                // Thumbnails are non-critical; original is safely uploaded
            }

            results.push({
                url: publicUrl,
                credits: newImageCredits[i]?.trim() || null,
                thumbnailUrl,
                microUrl,
                tamanhoOriginal: originalSize,
                tamanhoThumbnail: thumbSize,
                tamanhoMicro: microSize,
            });
        }

        return results;
    }, [imageFiles, newImageCredits]);

    return {
        imageFiles,
        imagePreviews,
        existingImages,
        editedCredits,
        newImageCredits,
        dragActive,
        fileInputRef,
        handleDrag,
        handleDrop,
        handleFileInput,
        handleFiles,
        removeNewImage,
        handleDeleteExistingImage,
        uploadImages,
        loadExistingImages,
        setEditedCredits,
        setNewImageCredits,
        reset
    };
}
