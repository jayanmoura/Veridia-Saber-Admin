-- ============================================================
-- Migration 006: Remove triggers quebrados que tentavam deletar
-- storage.objects diretamente via SQL (erro 42501)
-- ============================================================

DROP TRIGGER IF EXISTS trigger_auto_delete_image ON public.imagens;
DROP TRIGGER IF EXISTS trigger_delete_image_file ON public.imagens;
DROP FUNCTION IF EXISTS public.auto_delete_storage_file();
DROP FUNCTION IF EXISTS public.delete_storage_on_image_delete();
