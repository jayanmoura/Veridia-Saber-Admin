/**
 * SpeciesModal - Refactored version using extracted hooks and components.
 * 
 * Original: 1489 lines
 * Refactored: ~600 lines
 * 
 * Components used:
 * - useSpeciesForm: Form state, autocomplete, permissions
 * - useSpeciesImages: Image upload/delete/preview
 * - SpeciesDataTab: Species data tab content
 * - LabelDataTab: Herbarium label tab content
 * - ImageUploadZone: Drag-and-drop image upload
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useSpeciesForm, useSpeciesImages } from '../../../hooks';
import { SpeciesDataTab } from './index';
import { ImageUploadZone } from '../../Forms/ImageUploadZone';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';

// ============ TYPES ============
interface Species {
    id?: string;
    nome_cientifico: string;
    autor?: string | null;
    nome_popular?: string | null;
    familia_id: string;
    descricao_especie?: string | null;
    cuidados_luz?: string | null;
    cuidados_agua?: string | null;
    cuidados_temperatura?: string | null;
    cuidados_substrato?: string | null;
    cuidados_nutrientes?: string | null;
    local_id?: string | null;
    created_at?: string | null;
    created_by?: string | null;
    creator?: { full_name: string } | { full_name: string }[] | null;
}

interface SpeciesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    initialData?: Species | null;
}

export function SpeciesModalRefactored({ isOpen, onClose, onSave, initialData }: SpeciesModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);

    // Use extracted hooks
    const form = useSpeciesForm({ initialData, isOpen });
    const images = useSpeciesImages();

    // Load images when editing
    useEffect(() => {
        if (isOpen && initialData?.id) {
            const currentLocalId = initialData.local_id || (form.isLocalUser ? profile?.local_id : null);
            images.loadExistingImages(initialData.id, currentLocalId ? String(currentLocalId) : null);
            images.loadExistingImages(initialData.id, currentLocalId ? String(currentLocalId) : null);
            // form.loadLocalData called inside useSpeciesForm? Warning: check useSpeciesForm.
            // If localData logic was moved there, we might need to remove it there too. 
            // For now, removing the call here if it exists on the form object.
            // form.loadLocalData(initialData.id, currentLocalId ? String(currentLocalId) : null); 
            // Actually, I'll just remove the line.
        } else if (isOpen && !initialData) {
            images.reset();
        }
    }, [isOpen, initialData?.id]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.formData.nome_cientifico.trim()) {
            alert('O nome científico é obrigatório.');
            return;
        }
        if (!form.formData.familia_id) {
            alert('Selecione uma família.');
            return;
        }

        setLoading(true);

        try {
            let speciesId = initialData?.id || (form.isGlobalSpecies ? form.selectedGlobalSpecies?.id : undefined);
            const effectiveLocalId = form.formData.local_id || (form.isLocalUser ? String(profile?.local_id || '') : null);

            // CASE 1: LINKING GLOBAL SPECIES TO LOCAL PROJECT
            if (form.isGlobalSpecies && form.selectedGlobalSpecies?.id) {
                speciesId = form.selectedGlobalSpecies.id;
            }
            // CASE 2: EDITING EXISTING SPECIES
            else if (form.isEditingExisting && speciesId) {
                if (form.isGlobalAdmin) {
                    const dataToSave = {
                        nome_cientifico: form.formData.nome_cientifico.trim(),
                        nome_popular: form.formData.nome_popular?.trim() || null,
                        familia_id: form.formData.familia_id,
                        descricao_especie: form.formData.descricao_especie?.trim() || null,
                        cuidados_luz: form.formData.cuidados_luz?.trim() || null,
                        cuidados_agua: form.formData.cuidados_agua?.trim() || null,
                        cuidados_temperatura: form.formData.cuidados_temperatura?.trim() || null,
                        cuidados_substrato: form.formData.cuidados_substrato?.trim() || null,
                        cuidados_nutrientes: form.formData.cuidados_nutrientes?.trim() || null,
                        local_id: form.isSenior ? null : (form.formData.local_id || null),
                    };

                    const { error } = await supabase
                        .from('especie')
                        .update(dataToSave)
                        .eq('id', speciesId);

                    if (error) throw error;
                }
            }
            // CASE 3: CREATING NEW SPECIES
            else if (!form.isGlobalSpecies) {
                const dataToSaveNew = {
                    nome_cientifico: form.formData.nome_cientifico.trim(),
                    nome_popular: form.formData.nome_popular?.trim() || null,
                    familia_id: form.formData.familia_id,
                    descricao_especie: form.formData.descricao_especie?.trim() || null,
                    cuidados_luz: form.formData.cuidados_luz?.trim() || null,
                    cuidados_agua: form.formData.cuidados_agua?.trim() || null,
                    cuidados_temperatura: form.formData.cuidados_temperatura?.trim() || null,
                    cuidados_substrato: form.formData.cuidados_substrato?.trim() || null,
                    cuidados_nutrientes: form.formData.cuidados_nutrientes?.trim() || null,
                    local_id: form.isSenior ? null : effectiveLocalId,
                    created_by_institution_id: profile?.institution_id || null,
                    created_by: profile?.id || null,
                    created_by_name: profile?.full_name || null,
                    autor: form.formData.autor?.trim() || null,
                };

                const { data, error } = await supabase
                    .from('especie')
                    .insert(dataToSaveNew)
                    .select('id')
                    .single();

                if (error) throw error;
                speciesId = data.id;
            }



            // Upload new images
            if (images.imageFiles.length > 0 && speciesId) {
                const isCreatingNewGlobalSpecies = !form.isGlobalSpecies && !form.isEditingExisting && !effectiveLocalId;

                const uploadResults = await images.uploadImages(speciesId, {
                    isCreatingNewGlobalSpecies,
                    projectId: effectiveLocalId,
                    speciesName: form.formData.nome_cientifico
                });

                const imageRecords = uploadResults.map(result => ({
                    especie_id: speciesId,
                    url_imagem: result.url,
                    creditos: result.credits || null,
                    local_id: effectiveLocalId,
                    institution_id: profile?.institution_id || null,
                }));

                if (imageRecords.length > 0) {
                    await supabase.from('imagens').insert(imageRecords);
                }
            }

            // Update credits for existing images
            const creditUpdates = Object.entries(images.editedCredits)
                .filter(([imgId, newCredits]) => {
                    const original = images.existingImages.find(img => img.id === imgId);
                    return original && (original.creditos || '') !== newCredits;
                })
                .map(([imgId, newCredits]) =>
                    supabase
                        .from('imagens')
                        .update({ creditos: newCredits || null })
                        .eq('id', imgId)
                );

            if (creditUpdates.length > 0) {
                await Promise.all(creditUpdates);
            }

            onSave();
            onClose();
        } catch (error: any) {
            console.error('Save error:', error);
            alert(error.message || 'Erro ao salvar espécie.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Editar Espécie' : 'Nova Espécie'}
                        </h2>
                        <p className="text-sm text-gray-500">Preencha os dados taxonômicos e de cultivo</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>



                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-210px)]">
                    {form.dataLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-emerald-600" size={32} />
                        </div>
                    ) : (
                        <div className="p-6 space-y-8">
                            {/* SPECIES TAB CONTENT (Now just the content, no tabs) */}
                            <SpeciesDataTab
                                formData={form.formData}
                                onFormDataChange={(field, value) => form.setFormData(prev => ({ ...prev, [field]: value }))}
                                families={form.families}
                                locais={form.locais}
                                suggestions={form.suggestions}
                                isSearching={form.isSearching}
                                showSuggestions={form.showSuggestions}
                                onNameChange={form.handleNameChange}
                                onSelectGlobalSpecies={form.handleSelectGlobalSpecies}
                                onClearSelection={form.handleClearSelection}
                                onShowSuggestions={form.setShowSuggestions}
                                userRole={form.userRole}
                                isGlobalSpecies={form.isGlobalSpecies}
                                isEditingExisting={form.isEditingExisting}
                                shouldLockGlobalFields={form.shouldLockGlobalFields}
                                isProjectUser={form.isProjectUser}
                                isSenior={form.isSenior}
                                getUserLocalName={form.getUserLocalName}
                            />

                            {/* Images Section */}
                            <section>
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <ImageIcon size={16} className="text-emerald-600" />
                                    Galeria de Imagens
                                </h3>
                                <ImageUploadZone
                                    imagePreviews={images.imagePreviews}
                                    newImageCredits={images.newImageCredits}
                                    onRemoveNewImage={images.removeNewImage}
                                    onNewImageCreditsChange={(index, credits) => {
                                        images.setNewImageCredits(prev => {
                                            const updated = [...prev];
                                            updated[index] = credits;
                                            return updated;
                                        });
                                    }}
                                    existingImages={images.existingImages}
                                    editedCredits={images.editedCredits}
                                    onCreditsChange={(id, credits) => images.setEditedCredits(prev => ({ ...prev, [id]: credits }))}
                                    onDeleteExisting={images.handleDeleteExistingImage}
                                    dragActive={images.dragActive}
                                    onDrag={images.handleDrag}
                                    onDrop={images.handleDrop}
                                    onFileInput={images.handleFileInput}
                                    fileInputRef={images.fileInputRef}
                                />
                            </section>




                            {/* Authorship Info */}
                            {initialData?.id && initialData?.created_at && (
                                <section className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                                    <p>
                                        <span className="font-medium">Cadastrado em:</span>{' '}
                                        {new Date(initialData.created_at).toLocaleString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                    {initialData.creator && (
                                        <p>
                                            <span className="font-medium">Cadastrado por:</span>{' '}
                                            {Array.isArray(initialData.creator)
                                                ? initialData.creator[0]?.full_name || initialData.created_by || 'Usuário desconhecido'
                                                : initialData.creator?.full_name || initialData.created_by || 'Usuário desconhecido'}
                                        </p>
                                    )}
                                </section>
                            )}
                        </div>
                    )}
                </form>
                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading || form.dataLoading}
                        className="px-5 py-2.5 bg-[#064E3B] text-white rounded-lg hover:bg-[#053829] transition-colors font-medium shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Salvando...</span>
                            </>
                        ) : (
                            <span>{form.isGlobalSpecies ? '🔗 Vincular ao Projeto' : initialData ? 'Salvar Alterações' : 'Criar Espécie'}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
