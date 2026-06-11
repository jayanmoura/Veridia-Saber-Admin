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
import { useAuth } from '../../../contexts/AuthContext';
import { useSpeciesForm, useSpeciesImages } from '../../../hooks';
import { SpeciesDataTab } from './SpeciesDataTab';
import { LabelDataTab } from './LabelDataTab';
import { ImageUploadZone } from '../../Forms/ImageUploadZone';
import { X, Loader2, Image as ImageIcon, FileText, Leaf } from 'lucide-react';

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

type UploadStage = 'idle' | 'compressing' | 'uploading' | 'saving';

const STAGE_LABEL: Record<Exclude<UploadStage, 'idle'>, string> = {
  compressing: 'Comprimindo imagens...',
  uploading: 'Enviando imagens...',
  saving: 'Salvando dados...',
};

export function SpeciesModalRefactored({ isOpen, onClose, onSave, initialData }: SpeciesModalProps) {
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
      const currentLocalId = initialData.local_id || (form.isLocalUser ? profile?.local_id : null);
      images.loadExistingImages(initialData.id, currentLocalId ? String(currentLocalId) : null);
      form.loadLocalData(initialData.id, currentLocalId ? String(currentLocalId) : null);
    } else {
      images.reset();
    }
  }, [isOpen, initialData?.id]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    if (!form.formData.nome_cientifico.trim()) {
      alert('O nome científico é obrigatório.');
      return;
    }
    if (!form.formData.familia_id) {
      alert('Selecione uma família.');
      return;
    }

    const hasNewImages = images.imageFiles.length > 0;

    setLoading(true);
    if (hasNewImages) setUploadStage('saving');

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

      // SAVE LOCAL DATA (especie_local)
      if (effectiveLocalId && speciesId) {
        let targetInstitutionId = profile?.institution_id;

        if (!targetInstitutionId) {
          try {
            const { data: localInfo } = await supabase
              .from('locais')
              .select('institution_id')
              .eq('id', effectiveLocalId)
              .single();

            if (localInfo?.institution_id) {
              targetInstitutionId = localInfo.institution_id;
            }
          } catch (err) {
            console.warn('Erro ao buscar institution_id do projeto:', err);
          }
        }

        if (!targetInstitutionId) {
          console.error('Erro: institution_id não encontrado');
          alert('Erro: Não foi possível identificar a instituição. Contate o administrador.');
        } else {
          const localPayload = {
            especie_id: speciesId,
            local_id: effectiveLocalId,
            institution_id: targetInstitutionId,
            descricao_ocorrencia: form.localData.descricao_ocorrencia?.trim() || null,
            detalhes_localizacao: form.localData.detalhes_localizacao?.trim() || null,
            latitude: form.localData.latitude ? parseFloat(form.localData.latitude) : null,
            longitude: form.localData.longitude ? parseFloat(form.localData.longitude) : null,
            determinador: form.localData.determinador?.trim() || null,
            data_determinacao: form.localData.data_determinacao || null,
            coletor: form.localData.coletor?.trim() || null,
            numero_coletor: form.localData.numero_coletor?.trim() || null,
            morfologia: form.localData.morfologia?.trim() || null,
            habitat_ecologia: form.localData.habitat_ecologia?.trim() || null,
          };

          const { error: localError } = await supabase
            .from('especie_local')
            .upsert(localPayload, { onConflict: 'especie_id,local_id' });

          if (localError) {
            console.error('Error saving local data:', localError);
            if (localError.code === '42501') {
              alert('Erro de permissão: Verifique suas credenciais com o administrador.');
            }
          }
        }
      }

      // Upload new images
      if (hasNewImages && speciesId) {
        const isCreatingNewGlobalSpecies = !form.isGlobalSpecies && !form.isEditingExisting && !effectiveLocalId;

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

      onSave();
      onClose();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Save error:', error);
      alert(err.message || 'Erro ao salvar espécie.');
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

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-white px-6">
          <button
            type="button"
            onClick={() => form.setActiveTab('species')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              form.activeTab === 'species'
                ? 'border-emerald-500 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Leaf size={15} />
            Dados da Espécie
          </button>
          <button
            type="button"
            onClick={() => form.setActiveTab('label')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              form.activeTab === 'label'
                ? 'border-emerald-500 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText size={15} />
            Etiqueta de Herbário
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-220px)]">
          {form.dataLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
          ) : (
            <div className="p-6 space-y-8">

              {/* ── SPECIES TAB ── */}
              {form.activeTab === 'species' && (
                <>
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
                </>
              )}

              {/* ── LABEL TAB ── */}
              {form.activeTab === 'label' && (
                <>
                  {/* GPS Button */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      📍 Geolocalização
                    </h3>
                    <button
                      type="button"
                      onClick={form.handleGetLocation}
                      disabled={form.geoLoading}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {form.geoLoading ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Obtendo...
                        </>
                      ) : (
                        <>📍 Obter Localização Atual</>
                      )}
                    </button>
                  </div>

                  <LabelDataTab
                    localData={form.localData}
                    onLocalDataChange={(field, value) =>
                      form.setLocalData(prev => ({ ...prev, [field]: value }))
                    }
                    formData={{
                      nome_cientifico: form.formData.nome_cientifico,
                      autor: form.formData.autor,
                      familia_id: form.formData.familia_id,
                    }}
                    families={form.families}
                  />
                </>
              )}

              {/* Authorship Info — shown in both tabs when editing */}
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
