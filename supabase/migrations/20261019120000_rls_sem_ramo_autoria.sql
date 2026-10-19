-- Aplicada em 19/10/2026 pelo SQL Editor.
-- Remove o ramo de autoria (created_by/criado_por/gestor_id = auth.uid()) das policies de escrita.
-- Regra do produto: quem perde o papel perde o acesso; a autoria fica só como dado.
begin;

drop policy if exists especie_insert_mixed on public.especie;
create policy especie_insert_mixed on public.especie for insert to authenticated
  with check (public.is_local_staff_for(local_id));
drop policy if exists especie_update_mixed on public.especie;
create policy especie_update_mixed on public.especie for update to authenticated
  using (public.is_local_staff_for(local_id))
  with check (public.is_local_staff_for(local_id) or local_id is null);

drop policy if exists especie_local_insert_mixed on public.especie_local;
create policy especie_local_insert_mixed on public.especie_local for insert to authenticated
  with check (public.is_local_staff_for(local_id));
drop policy if exists especie_local_update_mixed on public.especie_local;
create policy especie_local_update_mixed on public.especie_local for update to authenticated
  using (public.is_local_staff_for(local_id))
  with check (public.is_local_staff_for(local_id));

drop policy if exists imagens_insert_mixed on public.imagens;
create policy imagens_insert_mixed on public.imagens for insert to authenticated
  with check (public.is_local_staff_for(local_id));
drop policy if exists imagens_update_mixed on public.imagens;
create policy imagens_update_mixed on public.imagens for update to authenticated
  using (public.is_local_staff_for(local_id))
  with check (public.is_local_staff_for(local_id));
drop policy if exists imagens_delete_mixed on public.imagens;
create policy imagens_delete_mixed on public.imagens for delete to authenticated
  using (public.is_local_staff_for(local_id));

drop policy if exists locais_update_mixed on public.locais;
create policy locais_update_mixed on public.locais for update to authenticated
  using ((select public.is_local_staff_for(locais.id)))
  with check ((select public.is_local_staff_for(locais.id)));

commit;
