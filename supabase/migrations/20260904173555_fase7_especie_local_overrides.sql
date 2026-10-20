-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Fase 7, item 1: fork global -> local da espécie (Opção A: tabela de overrides)
-- Apenas descricao_especie é overridável por projeto; nome_popular, autor,
-- familia e cuidados_* continuam 100% globais em `especie`.

CREATE TABLE public.especie_local_overrides (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  especie_id TEXT NOT NULL REFERENCES public.especie(id) ON DELETE CASCADE,
  local_id BIGINT NOT NULL REFERENCES public.locais(id) ON DELETE CASCADE,
  descricao_especie TEXT,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (especie_id, local_id)
);

COMMENT ON TABLE public.especie_local_overrides IS
  'Fase 7: sobrescreve a descrição botânica da espécie por projeto (local_id), sem alterar o registro global em especie. Criado em 04/09/2026.';

ALTER TABLE public.especie_local_overrides ENABLE ROW LEVEL SECURITY;

-- SELECT aberto, inclusive para anon (visitante do portal público navegando
-- dentro de um projeto/local específico), mesmo padrão de especie_local/imagens.
CREATE POLICY especie_local_overrides_select_all
  ON public.especie_local_overrides
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY especie_local_overrides_insert_staff
  ON public.especie_local_overrides
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_local_staff_for(local_id));

CREATE POLICY especie_local_overrides_update_staff
  ON public.especie_local_overrides
  FOR UPDATE
  TO authenticated
  USING (public.is_local_staff_for(local_id))
  WITH CHECK (public.is_local_staff_for(local_id));

CREATE POLICY especie_local_overrides_delete_staff
  ON public.especie_local_overrides
  FOR DELETE
  TO authenticated
  USING (public.is_local_staff_for(local_id));

-- Trigger simples para manter updated_at em dia
CREATE OR REPLACE FUNCTION public.set_especie_local_overrides_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_especie_local_overrides_updated_at
  BEFORE UPDATE ON public.especie_local_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.set_especie_local_overrides_updated_at();

-- RPC dedicado de autocomplete para o formulário de espécie do admin
-- (buscar_botanica existente mistura família+espécie e é voltado ao chatbot)
CREATE OR REPLACE FUNCTION public.buscar_especie_autocomplete(termo TEXT)
RETURNS TABLE(id TEXT, nome_cientifico TEXT, autor TEXT, nome_popular TEXT, familia_id TEXT)
LANGUAGE sql
STABLE
SET search_path = 'public', 'extensions'
AS $$
  SELECT e.id, e.nome_cientifico, e.autor, e.nome_popular, e.familia_id
  FROM public.especie e
  WHERE unaccent(e.nome_cientifico) ILIKE unaccent('%' || termo || '%')
  ORDER BY e.nome_cientifico
  LIMIT 10;
$$;

REVOKE ALL ON FUNCTION public.buscar_especie_autocomplete(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_especie_autocomplete(TEXT) TO anon, authenticated;
