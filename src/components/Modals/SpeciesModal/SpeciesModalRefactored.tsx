/**
 * SpeciesModal - Refactored version using extracted hooks and components.
 *
 * Original: 1489 lines
 * Refactored: ~600 lines
 *
 * Components used:
 * - useSpeciesForm: Form state, autocomplete, permissions, tabs, geo
 * - useSpeciesImages: Image upload/delete/preview
 * - SpeciesDataTab: Species data tab content
 * - LabelDataTab: Herbarium label tab content
 * - ImageUploadZone: Drag-and-drop image upload
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/authContext';
import { useSpeciesForm, useSpeciesImages } from '../../../hooks';
import { useToast } from '../../../hooks/useToast';
import { SpeciesDataTab } from './SpeciesDataTab';
import { ImageUploadZone } from '../../Forms/ImageUploadZone';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';

// ============ TYPES ============
import type { Species } from '../../../types/domain';

interface SpeciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: Species | null;
  onRequestSpecimenCreation?: (especieId: string, localId: string, speciesName?: string) => void;
}

type UploadStage = 'idle' | 'compressing' | 'uploading' | 'saving';

const STAGE_LABEL: Record<Exclude<UploadStage, 'idle'>, string> = {
  compressing: 'Comprimindo imagens...',
  uploading: 'Enviando imagens...',
  saving: 'Salvando dados...',
};

export function SpeciesModalRefactored({
  isOpen,
  onClose,
  onSave,
  initialData,
  onRequestSpecimenCreation,
}: SpeciesModalProps) {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const isSubmitting = useRef(false);

  // Use extracted hooks
  const form = useSpeciesForm({ initialData, isOpen });
  const images = useSpeciesImages();

  // Load images when editing; reset when modal closes or species changes
  useEffect(() => {
    if (!isOpen) {
      images.reset();
      return;
    }
    if (initialData?.id) {
      const currentLocalId = initialData.local_id || form.formData.local_id || (form.isLocalUser ? profile?.local_id : null);
      images.loadExistingImages(initialData.id, currentLocalId ? String(currentLocalId) : null);
      form.loadLocalData(initialData.id, currentLocalId ? String(currentLocalId) : null);
    } else {
      images.reset();
    }
    // 'form', 'images', 'initialData.local_id' e 'profile?.local_id'
    // excluídos intencionalmente: 'form' e 'images' são objetos novos a
    // cada render (retornados por useSpeciesForm/useSpeciesImages sem
    // memoização), incluí-los faria este efeito rodar em todo render e
    // resetar o formulário/imagens repetidamente. Este efeito já reage
    // corretamente a 'isOpen' e 'initialData?.id', que são os gatilhos
    // reais de troca de espécie/abertura do modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData?.id]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    if (!form.formData.nome_cientifico.trim()) {
      showToast('O nome científico é obrigatório.', 'warning');
      return;
    }
    if (!form.formData.familia_id) {
      showToast('Selecione uma família.', 'warning');
      return;
    }

    const hasNewImages = images.imageFiles.length > 0;

    setLoading(true);
    if (hasNewImages) setUploadStage('saving');

    try {
      let speciesId = initialData?.id || (form.selectedEspecieId ? form.selectedEspecieId : undefined);
      const effectiveLocalId = form.formData.local_id || initialData?.local_id || (form.isLocalUser ? String(profile?.local_id || '') : null);

      // CASO 2: VINCULANDO ESPÉCIE DO CATÁLOGO GLOBAL (selectedEspecieId preenchido)
      if (form.selectedEspecieId) {
        if (!effectiveLocalId) {
          showToast('Selecione um projeto/local para vincular a espécie.', 'warning');
          return;
        }
        speciesId = form.selectedEspecieId;
      }
      // CASO EDIT: EDITANDO ESPÉCIE EXISTENTE
      else if (form.isEditingExisting && speciesId) {
        if (form.isGlobalAdmin) {
          const dataToSave = {
            nome_cientifico: form.formData.nome_cientifico.trim(),
            nome_popular: form.formData.nome_popular?.trim() || null,
            familia_id: form.formData.familia_id,
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
      // CASO 1: CRIANDO NOVA ESPÉCIE (selectedEspecieId é null)
      else if (!form.selectedEspecieId) {
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

      // OVERRIDE LOCAL (especie_local_overrides): grava descricao_especie E notas_projeto numa única chamada
      if (effectiveLocalId && speciesId) {
        // Para espécie global vinculada ou edição existente, a descrição no form é override local.
        // Para espécie nova criada, a descrição botânica já foi gravada na tabela global `especie`.
        const isNewGlobalSpecies = !form.selectedEspecieId && !form.isEditingExisting;
        const descricaoTrimmed = isNewGlobalSpecies
          ? null
          : (form.formData.descricao_especie?.trim() || null);
        const notasTrimmed = form.localData.notas_projeto?.trim() || null;
        const hasAnyOverride = Boolean(descricaoTrimmed || notasTrimmed);

        if (hasAnyOverride) {
          const { error: overrideError } = await supabase
            .from('especie_local_overrides')
            .upsert({
              especie_id: speciesId,
              local_id: effectiveLocalId,
              descricao_especie: descricaoTrimmed,
              notas_projeto: notasTrimmed,
              created_by: profile?.id || null,
            }, { onConflict: 'especie_id,local_id' });

          if (overrideError) throw overrideError;
        } else if (form.hasExistingOverride) {
          const { error: deleteError } = await supabase
            .from('especie_local_overrides')
            .delete()
            .eq('especie_id', speciesId)
            .eq('local_id', effectiveLocalId);

          if (deleteError) throw deleteError;
        }
      }


      // Upload new images
      if (hasNewImages && speciesId) {
        const isCreatingNewGlobalSpecies = !form.selectedEspecieId && !form.isEditingExisting && !effectiveLocalId;

        setUploadStage('uploading');
        const uploadResults = await images.uploadImages(speciesId, {
          isCreatingNewGlobalSpecies,
          projectId: effectiveLocalId,
          speciesName: form.formData.nome_cientifico,
          onStageChange: setUploadStage,
        });

        setUploadStage('saving');
        const imageRecords = uploadResults.map(result => ({
          especie_id: speciesId,
          especime_id: null,
          url_imagem: result.url,
          url_thumbnail: result.thumbnailUrl || null,
          url_micro: result.microUrl || null,
          creditos: result.credits || null,
          local_id: effectiveLocalId || null,
          institution_id: profile?.institution_id || null,
          tamanho_original: result.tamanhoOriginal || null,
          tamanho_thumbnail: result.tamanhoThumbnail || null,
          tamanho_micro: result.tamanhoMicro || null,
          tamanho_estimado: false,
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

      let shouldOpenSpecimenModal = false;

      if (effectiveLocalId && speciesId && onRequestSpecimenCreation) {
        const { data: existingSpecimens, error: checkError } = await supabase
          .from('especie_local')
          .select('id')
          .eq('especie_id', speciesId)
          .eq('local_id', effectiveLocalId)
          .limit(1);

        if (!checkError && (!existingSpecimens || existingSpecimens.length === 0)) {
          shouldOpenSpecimenModal = true;
        }
      }

      onSave();

      if (shouldOpenSpecimenModal && onRequestSpecimenCreation && effectiveLocalId && speciesId) {
        onClose();
        onRequestSpecimenCreation(speciesId, effectiveLocalId, form.formData.nome_cientifico);
      } else {
        onClose();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Save error:', error);
      showToast(err.message || 'Erro ao salvar espécie.', 'error');
    } finally {
      setLoading(false);
      setUploadStage('idle');
      isSubmitting.current = false;
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div role="dialog" className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop — blocked during upload */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={uploadStage === 'idle' && !loading ? onClose : undefined}
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
            disabled={uploadStage !== 'idle' || loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-170px)]">
          {form.dataLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
          ) : (
            <div className="p-6 space-y-8">
              <SpeciesDataTab
                formData={form.formData}
                onFormDataChange={(field, value) => form.setFormData(prev => ({ ...prev, [field]: value }))}
                families={form.families}
                locais={form.locais}
                selectedEspecieId={form.selectedEspecieId}
                suggestions={form.suggestions}
                isSearching={form.isSearching}
                showSuggestions={form.showSuggestions}
                onNameChange={form.handleNameChange}
                onSelectGlobalSpecies={form.handleSelectGlobalSpecies}
                onClearSelection={form.handleClearSelection}
                onShowSuggestions={form.setShowSuggestions}
                isAutorReadOnly={form.isAutorReadOnly}
                isFamiliaReadOnly={form.isFamiliaReadOnly}
                userRole={form.userRole}
                isEditingExisting={form.isEditingExisting}
                shouldLockGlobalFields={form.shouldLockGlobalFields}
                isProjectUser={form.isProjectUser}
                isSenior={form.isSenior}
                getUserLocalName={form.getUserLocalName}
                localData={form.localData}
                onLocalDataChange={form.setLocalData}
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

              {/* Authorship Info — shown when editing */}
              {initialData?.id && initialData?.created_at && (
                <section className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                  <p>
                    <span className="font-medium">Cadastrado em:</span>{' '}
                    {new Date(initialData.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 min-h-[68px]">
          {uploadStage !== 'idle' ? (
            <div className="flex items-center gap-2.5 text-emerald-700">
              <Loader2 size={18} className="animate-spin text-emerald-600 shrink-0" />
              <span className="text-sm font-medium">{STAGE_LABEL[uploadStage]}</span>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
