-- =============================================================================
-- FIX SECURITY WARNINGS - Veridia Saber (Versão Safe)
-- Correção dos warnings com permissões que preservam o fluxo de trabalho
-- Data: 2026-01-29
-- =============================================================================

-- =============================================================================
-- 1. FIX: function_search_path_mutable
-- =============================================================================
alter function public._rls_rewrite_initplan(text) set search_path = pg_catalog, public;

-- =============================================================================
-- 2. HELPER FUNCTIONS
-- =============================================================================
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('super_admin', 'admin', 'catalogador')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('super_admin', 'admin')
  );
$$;

-- =============================================================================
-- 3. NOTIFICATIONS & AUDIT - Apenas Staff (Segurança Estrita)
-- =============================================================================

-- admin_notifications
drop policy if exists "Permitir Envio de Notificação" on public.admin_notifications;
create policy "Permitir Envio de Notificação" 
on public.admin_notifications for INSERT 
to authenticated
with check ( public.is_staff() );

-- audit_logs
drop policy if exists "Staff cria logs" on public.audit_logs;
create policy "Staff cria logs" 
on public.audit_logs for INSERT 
to authenticated
with check ( public.is_staff() );

-- =============================================================================
-- 4. ESPÉCIMES (especie_local) - Flexível para Workflow
-- =============================================================================
drop policy if exists "especie_local_delete_auth" on public.especie_local;
drop policy if exists "especie_local_insert_auth" on public.especie_local;
drop policy if exists "especie_local_update_auth" on public.especie_local;

-- INSERT: Staff ou qualquer um inserindo para si
create policy "especie_local_insert_auth" 
on public.especie_local for INSERT 
to authenticated
with check (
  public.is_staff() 
  or created_by = (select auth.uid())
);

-- UPDATE: Staff ou dono do registro
create policy "especie_local_update_auth" 
on public.especie_local for UPDATE 
to authenticated
using (
  public.is_staff() 
  or created_by = (select auth.uid())
)
with check (
  public.is_staff() 
  or created_by = (select auth.uid())
);

-- DELETE: Admin OU Dono do registro (Permite correção de erros)
create policy "especie_local_delete_auth" 
on public.especie_local for DELETE 
to authenticated
using (
  public.is_admin() 
  or created_by = (select auth.uid())
);

-- =============================================================================
-- 5. IMAGENS - Flexível para Workflow
-- =============================================================================
drop policy if exists "Admin insere imagens" on public.imagens;
drop policy if exists "Admin deleta imagens" on public.imagens;

-- INSERT: Staff ou dono
create policy "Admin insere imagens" 
on public.imagens for INSERT 
to authenticated
with check (
  public.is_staff()
  or criado_por = (select auth.uid())::text
);

-- DELETE: Admin OU Dono da imagem
create policy "Admin deleta imagens" 
on public.imagens for DELETE 
to authenticated
using (
  public.is_admin()
  or criado_por = (select auth.uid())::text
);

-- =============================================================================
-- 6. FAMÍLIAS & LEGADO - Restrito (Dados Mestre)
-- =============================================================================
-- Famílias não devem ser alteradas por qualquer um, mantém restrição
drop policy if exists "Admin pode inserir familias" on public.familia;
drop policy if exists "Admin pode atualizar familias" on public.familia;
drop policy if exists "Admin pode deletar familias" on public.familia;

create policy "Admin pode inserir familias" on public.familia for INSERT to authenticated with check ( public.is_staff() );
create policy "Admin pode atualizar familias" on public.familia for UPDATE to authenticated using ( public.is_staff() );
create policy "Admin pode deletar familias" on public.familia for DELETE to authenticated using ( public.is_admin() );

-- Legado
drop policy if exists "familia_legado_insert_auth" on public.familia_nomenclatura_legado;
drop policy if exists "familia_legado_update_auth" on public.familia_nomenclatura_legado;
drop policy if exists "familia_legado_delete_auth" on public.familia_nomenclatura_legado;

create policy "familia_legado_insert_auth" on public.familia_nomenclatura_legado for INSERT to authenticated with check ( public.is_staff() );
create policy "familia_legado_update_auth" on public.familia_nomenclatura_legado for UPDATE to authenticated using ( public.is_staff() );
create policy "familia_legado_delete_auth" on public.familia_nomenclatura_legado for DELETE to authenticated using ( public.is_admin() );

-- =============================================================================
-- 7. CROWDSOURCING (especie)
-- =============================================================================
drop policy if exists "Permitir contribuição de espécies (Crowdsourcing)" on public.especie;
create policy "Permitir contribuição de espécies (Crowdsourcing)" 
on public.especie for INSERT 
to authenticated
with check (
  (created_by = (select auth.uid()) or created_by is null)
);
