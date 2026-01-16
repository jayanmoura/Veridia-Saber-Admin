-- Create table for Herbarium Labels (Etiquetas)
create table if not exists public.etiquetas (
    id uuid default gen_random_uuid() primary key,
    especie_local_id bigint references public.especie_local(id) on delete cascade not null,
    created_at timestamptz default now() not null,
    gerado_por uuid references auth.users(id),
    conteudo_json jsonb, -- To store a snapshot of the label data at generation time
    numero_tombo bigint -- Redundant if same as especie_local_id, but good for explicit record
);

-- Add comment
comment on table public.etiquetas is 'Registros de etiquetas de herbário geradas.';

-- RLS
alter table public.etiquetas enable row level security;

create policy "Users can view labels from their projects"
    on public.etiquetas for select
    using (
        exists (
            select 1 from public.especie_local el
            where el.id = public.etiquetas.especie_local_id
            and (
                -- Local admin check
                el.local_id = (select local_id from public.profiles where id = auth.uid())
                or
                -- Global admin check
                exists (
                    select 1 from public.profiles
                    where id = auth.uid()
                    and role in ('Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior')
                )
            )
        )
    );

create policy "Users can insert labels for their projects"
    on public.etiquetas for insert
    with check (
        exists (
            select 1 from public.especie_local el
            where el.id = especie_local_id
            and (
                el.local_id = (select local_id from public.profiles where id = auth.uid())
                or
                exists (
                    select 1 from public.profiles
                    where id = auth.uid()
                    and role in ('Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior')
                )
            )
        )
    );
