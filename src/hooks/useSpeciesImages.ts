import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { compressImage, compressForListing } from '../utils/imageCompressor';
import { uploadFile, deleteFile, parseStorageUrl } from '../utils/storage';

// ============ TYPES ============
export interface ExistingImage {
    id: string;
    url_imagem: string;
    url_thumbnail: string | null;
    url_micro: string | null;
    creditos: string | null;
}

export interface UseSpeciesImagesOptions {
    speciesId?: string;
    localId?: string | null;
}

export interface UseSpeciesImagesReturn {
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
    uploadImages: (speciesId: string, options: UploadOptions) => Promise<{ url: string; credits: string | null; thumbnailUrl: string | null; microUrl: string | null; tamanhoOriginal: number; tamanhoThumbnail: number | null; tamanhoMicro: number | null }[]>;
    loadExistingImages: (speciesId: string, localId: string | null) => Promise<void>;
    setEditedCredits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setNewImageCredits: React.Dispatch<React.SetStateAction<string[]>>;
    reset: () => void;
}

export interface UploadOptions {
    isCreatingNewGlobalSpecies: boolean;
    projectId: string | null;
    speciesName: string;
    onStageChange?: (stage: 'compressing' | 'uploading') => void;
}

/**
 * @description Hook para manipulação de arquivos de imagens de espécies com drag & drop e suporte multi-bucket (global e projetos).
 *
 * @returns {UseSpeciesImagesReturn} Estado e controle do filepicker:
 *   - `imageFiles`, `imagePreviews` — UI lists client-side
 *   - `existingImages` — array do Supabase db mapping bucket paths
 *   - `editedCredits`, `newImageCredits` — input tracking para campos de foto
 *   - Handlers visuais: `handleDrag`, `handleDrop`, `removeNewImage`
 *   - Actions API: `uploadImages`, `handleDeleteExistingImage`, `loadExistingImages`
 *   - Utils: `reset`, `setEditedCredits`
 *
 * @example
 * const { imagePreviews, handleFileInput, uploadImages } = useSpeciesImages()
 */
export function useSpeciesImages(): UseSpeciesImagesReturn {
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

    // Load existing images for a species
    const loadExistingImages = useCallback(async (speciesId: string, localId: string | null) => {
        // Clear stale images immediately so previous species' images don't flash
        setExistingImages([]);
        setEditedCredits({});

        let query = supabase
            .from('imagens')
            .select('id, url_imagem, url_thumbnail, url_micro, creditos')
            .eq('especie_id', speciesId);

        if (localId) {
            query = query.eq('local_id', localId);
        }

        const { data } = await query;

        if (data) {
            setExistingImages(data.map(img => ({
                id: img.id,
                url_imagem: img.url_imagem,
                url_thumbnail: img.url_thumbnail || null,
                url_micro: img.url_micro || null,
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
        const currentTotal = existingImages.length + imageFiles.length;
        const availableSlots = 3 - currentTotal;

        if (availableSlots <= 0) {
            alert('Atenção: Limite máximo de 3 fotos de capa atingido para esta espécie.');
            return;
        }

        const imageFilesOnly = files.filter(f => f.type.startsWith('image/')).slice(0, availableSlots);

        if (files.length > availableSlots) {
            alert(`Apenas as primeiras ${availableSlots} imagens foram adicionadas (limite de 3).`);
        }

        const newPreviews = imageFilesOnly.map(file => URL.createObjectURL(file));
        const defaultCredits = imageFilesOnly.map(() => 'Fotografado por ');

        setImageFiles(prev => [...prev, ...imageFilesOnly]);
        setImagePreviews(prev => [...prev, ...newPreviews]);
        setNewImageCredits(prev => [...prev, ...defaultCredits]);
    }, [existingImages.length, imageFiles.length]);

    const removeNewImage = useCallback((index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
        setNewImageCredits(prev => prev.filter((_, i) => i !== index));
    }, []);



    // Delete existing image
    const handleDeleteExistingImage = useCallback(async (imageId: string, imageUrl: string) => {
        try {
            const storageInfo = parseStorageUrl(imageUrl);
            if (storageInfo) {
                await deleteFile(storageInfo.bucket, storageInfo.path);
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

    // Upload images with hybrid bucket strategy
    const uploadImages = useCallback(async (
        speciesId: string,
        options: UploadOptions
    ): Promise<{ url: string; credits: string | null; thumbnailUrl: string | null; microUrl: string | null; tamanhoOriginal: number; tamanhoThumbnail: number | null; tamanhoMicro: number | null }[]> => {
        const results: { url: string; credits: string | null; thumbnailUrl: string | null; microUrl: string | null; tamanhoOriginal: number; tamanhoThumbnail: number | null; tamanhoMicro: number | null }[] = [];

        const sanitizedSpeciesName = options.speciesName
            ? options.speciesName
                .trim()
                .normalize('NFD')                    // decompõe acentos (ê → e + ̂)
                .replace(/[\u0300-\u036f]/g, '')     // remove os diacríticos
                .replace(/[^a-zA-Z0-9\s_-]/g, '')   // remove outros caracteres especiais
                .replace(/\s+/g, '_')               // substitui espaços por _
                .toLowerCase()
            : 'sem_nome';

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const fileExt = file.name.split('.').pop();
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(7);

            let bucket: string;
            let filePath: string;

            if (options.isCreatingNewGlobalSpecies || !options.projectId) {
                bucket = 'imagens-plantas';
                filePath = `especies/${speciesId}/${timestamp}_${randomSuffix}.${fileExt}`;
            } else {
                bucket = 'arquivos-gerais';
                filePath = `locais/${options.projectId}/imagens/${sanitizedSpeciesName}/${timestamp}_${randomSuffix}.${fileExt}`;
            }

            options.onStageChange?.('uploading');
            let publicUrl: string;
            try {
                publicUrl = await uploadFile(bucket, filePath, file);
            } catch (error) {
                console.error('Error uploading file:', error);
                continue;
            }

            // Generate and upload thumbnails (non-critical — failure does not abort the upload)
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

                const [thumbResult, microResult] = await Promise.allSettled([
                    uploadFile(bucket, `${dir}/thumbs/${base}`, thumbFile),
                    uploadFile(bucket, `${dir}/micro/${base}`, microFile)
                ]);

                if (thumbResult.status === 'fulfilled') {
                    thumbnailUrl = thumbResult.value;
                }
                if (microResult.status === 'fulfilled') {
                    microUrl = microResult.value;
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
