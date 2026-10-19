-- Aplicada em 19/10/2026 pelo SQL Editor.
-- Gestor de Acervo não pode alterar gestor_id, institution_id nem sigla do próprio local.
-- Só admin global, ou contexto de sistema (service_role, SQL Editor, FK ao apagar usuário).
begin;

create or replace function public.protect_locais_admin_columns()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or public.is_global_admin() then
    return new;
  end if;
  if new.gestor_id is distinct from old.gestor_id
     or new.institution_id is distinct from old.institution_id
     or new.sigla is distinct from old.sigla then
    raise exception 'Somente o administrador global pode alterar gestor, instituição ou sigla do local.';
  end if;
  return new;
end $$;

revoke all on function public.protect_locais_admin_columns() from public, anon, authenticated;

drop trigger if exists trg_protect_locais_admin_columns on public.locais;
create trigger trg_protect_locais_admin_columns
  before update on public.locais
  for each row execute function public.protect_locais_admin_columns();

commit;
