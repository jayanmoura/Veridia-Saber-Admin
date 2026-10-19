-- Aplicada em 19/10/2026 pelo SQL Editor.
begin;

drop function if exists public.buscar_botanica(text);          -- o app usa a de 2 argumentos
drop function if exists public._rls_rewrite_initplan(text);    -- utilitário antigo de reescrita de policies

revoke execute on function public.buscar_especie_autocomplete(text) from anon;

alter table public.especie drop constraint if exists fk_especie_created_by;  -- duplicada de especie_created_by_fkey

commit;
