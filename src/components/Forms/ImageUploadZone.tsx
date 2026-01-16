import { Upload, Trash2, ImageOff } from 'lucide-react';

export interface ExistingImage {
    id: string;
    url_imagem: string;
    creditos: string | null;
}

interface ImageUploadZoneProps {
    // New images
    imagePreviews: string[];
    newImageCredits: string[];
    onRemoveNewImage: (index: number) => void;
    onNewImageCreditsChange: (index: number, credits: string) => void;

    // Existing images
    existingImages: ExistingImage[];
    editedCredits: Record<string, string>;
    onCreditsChange: (imageId: string, credits: string) => void;
    onDeleteExisting: (imageId: string, imageUrl: string) => void;

    // Drag & drop
    dragActive: boolean;
    onDrag: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;

    // Optional
    disabled?: boolean;
}

/**
 * Reusable image upload zone with drag-and-drop support.
 * Displays both new upload previews and existing images with credit editing.
 */
export function ImageUploadZone({
    imagePreviews,
    newImageCredits,
    onRemoveNewImage,
    onNewImageCreditsChange,
    existingImages,
    editedCredits,
    onCreditsChange,
    onDeleteExisting,
    dragActive,
    onDrag,
    onDrop,
    onFileInput,
    fileInputRef,
    disabled = false
}: ImageUploadZoneProps) {
    return (
        <div className="space-y-4">
            {/* Upload Zone */}
            <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${disabled
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : dragActive
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer'
                    }`}
                onDragEnter={disabled ? undefined : onDrag}
                onDragLeave={disabled ? undefined : onDrag}
                onDragOver={disabled ? undefined : onDrag}
                onDrop={disabled ? undefined : onDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <Upload className={`mx-auto mb-2 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} size={32} />
                <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                    {disabled
                        ? 'Upload desabilitado'
                        : 'Arraste imagens aqui ou clique para selecionar'
                    }
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onFileInput}
                    disabled={disabled}
                />
            </div>

            {/* Preview Grid */}
            {(imagePreviews.length > 0 || existingImages.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Existing Images */}
                    {existingImages.map((img) => (
                        <div key={img.id} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={img.url_imagem}
                                    alt="Imagem existente"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '';
                                        (e.target as HTMLImageElement).classList.add('hidden');
                                        const parent = (e.target as HTMLImageElement).parentElement;
                                        if (parent) {
                                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-100"><span class="text-gray-400 text-xs">Erro ao carregar</span></div>`;
                                        }
                                    }}
                                />
                            </div>

                            {/* Credits Input */}
                            <input
                                type="text"
                                placeholder="Créditos (opcional)"
                                value={editedCredits[img.id] || ''}
                                onChange={(e) => onCreditsChange(img.id, e.target.value)}
                                className="mt-1 w-full text-xs px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                disabled={disabled}
                            />

                            {/* Delete Button */}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => onDeleteExisting(img.id, img.url_imagem)}
                                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                    title="Excluir imagem"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* New Image Previews */}
                    {imagePreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border-2 border-emerald-300 bg-emerald-50">
                                <img
                                    src={preview}
                                    alt={`Nova imagem ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Credits Input for New Image */}
                            <input
                                type="text"
                                placeholder="Fotografado por..."
                                value={newImageCredits[index] || ''}
                                onChange={(e) => onNewImageCreditsChange(index, e.target.value)}
                                className="mt-1 w-full text-xs px-2 py-1 border border-emerald-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50"
                                disabled={disabled}
                            />

                            <span className="absolute bottom-8 left-1 text-xs bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                                Nova
                            </span>

                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveNewImage(index)}
                                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                    title="Remover imagem"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {imagePreviews.length === 0 && existingImages.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm flex items-center justify-center gap-2">
                    <ImageOff size={16} />
                    <span>Nenhuma imagem ainda</span>
                </div>
            )}
        </div>
    );
}
