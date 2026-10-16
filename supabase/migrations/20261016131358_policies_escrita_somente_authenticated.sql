-- Registro de migration ja aplicada em producao.
ALTER POLICY conteudo_delete_staff ON public.conteudo_orgaos TO authenticated;
ALTER POLICY conteudo_insert_staff ON public.conteudo_orgaos TO authenticated;
ALTER POLICY conteudo_update_staff ON public.conteudo_orgaos TO authenticated;
ALTER POLICY familia_delete_admin ON public.familia TO authenticated;
ALTER POLICY familia_insert_staff ON public.familia TO authenticated;
ALTER POLICY familia_update_staff ON public.familia TO authenticated;
ALTER POLICY familia_legado_delete_auth ON public.familia_nomenclatura_legado TO authenticated;
ALTER POLICY familia_legado_insert_auth ON public.familia_nomenclatura_legado TO authenticated;
ALTER POLICY familia_legado_update_auth ON public.familia_nomenclatura_legado TO authenticated;
ALTER POLICY locais_delete_admin ON public.locais TO authenticated;
ALTER POLICY locais_insert_staff ON public.locais TO authenticated;
ALTER POLICY "Users can view their own institution" ON public.institutions TO authenticated;
