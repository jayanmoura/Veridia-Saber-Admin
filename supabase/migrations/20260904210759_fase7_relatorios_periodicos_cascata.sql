-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Fase 7, Feature 2: relatórios periódicos em cascata (mensal -> bimestral ->
-- semestral -> anual). Cada nível superior soma os dados JÁ EXTRAÍDOS dos
-- relatórios de nível inferior, nunca reconsulta audit_logs além do mês
-- fechado mais recente. Isso permite manter a retenção de audit_logs em 60
-- dias (Feature 3) sem prejudicar os relatórios de longo prazo.

CREATE TABLE public.relatorios_periodicos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('mensal','bimestral','semestral','anual')),
  ano INT NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL, -- exclusivo (primeiro dia depois do período)
  periodo_label TEXT NOT NULL,
  dados JSONB NOT NULL,
  gerado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tipo, periodo_inicio, periodo_fim)
);

COMMENT ON TABLE public.relatorios_periodicos IS
  'Fase 7: relatórios de atividade em cascata. dados = {"por_tabela": {"<table>": {"INSERT": n, "UPDATE": n, "DELETE": n}}, "total": n}. Criado em 04/09/2026.';

ALTER TABLE public.relatorios_periodicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY relatorios_periodicos_select_staff
  ON public.relatorios_periodicos
  FOR SELECT
  TO authenticated
  USING (public.is_global_admin());

-- Sem policy de INSERT/UPDATE/DELETE para authenticated: só é escrito pela
-- função abaixo, executada via pg_cron (bypassa RLS por rodar como owner).

-- Agrega audit_logs bruto num intervalo [p_inicio, p_fim) em JSONB.
CREATE OR REPLACE FUNCTION public.fn_agregar_audit_logs(p_inicio TIMESTAMPTZ, p_fim TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = 'public', 'pg_catalog'
AS $$
  WITH contagens AS (
    SELECT table_name, action_type, COUNT(*) AS qtd
    FROM public.audit_logs
    WHERE created_at >= p_inicio AND created_at < p_fim
    GROUP BY table_name, action_type
  ),
  por_tabela AS (
    SELECT table_name, jsonb_object_agg(action_type, qtd) AS acoes
    FROM contagens
    GROUP BY table_name
  )
  SELECT jsonb_build_object(
    'por_tabela', COALESCE((SELECT jsonb_object_agg(table_name, acoes) FROM por_tabela), '{}'::jsonb),
    'total', COALESCE((SELECT SUM(qtd) FROM contagens), 0)
  );
$$;

-- Soma os campos 'dados' de vários relatórios já gerados (por id), sem
-- tocar em audit_logs.
CREATE OR REPLACE FUNCTION public.fn_somar_dados_relatorios(p_ids BIGINT[])
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = 'public', 'pg_catalog'
AS $$
  WITH expandido AS (
    SELECT t.key AS table_name, a.key AS action_type, (a.value)::bigint AS qtd
    FROM public.relatorios_periodicos r,
         LATERAL jsonb_each(r.dados->'por_tabela') AS t(key, value),
         LATERAL jsonb_each_text(t.value) AS a(key, value)
    WHERE r.id = ANY(p_ids)
  ),
  somado AS (
    SELECT table_name, action_type, SUM(qtd) AS qtd
    FROM expandido
    GROUP BY table_name, action_type
  ),
  por_tabela AS (
    SELECT table_name, jsonb_object_agg(action_type, qtd) AS acoes
    FROM somado
    GROUP BY table_name
  )
  SELECT jsonb_build_object(
    'por_tabela', COALESCE((SELECT jsonb_object_agg(table_name, acoes) FROM por_tabela), '{}'::jsonb),
    'total', COALESCE((SELECT SUM(qtd) FROM somado), 0)
  );
$$;

-- Orquestrador principal: roda todo dia 05, gera o mensal do mês fechado e,
-- em cascata, bimestral/semestral/anual quando o calendário fechar o bloco.
CREATE OR REPLACE FUNCTION public.fn_gerar_relatorios_periodicos()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
  meses_pt TEXT[] := ARRAY['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  meses_abrev_pt TEXT[] := ARRAY['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  v_mes_inicio DATE;
  v_mes_fim DATE;
  v_mes_num INT;
  v_ano INT;
  v_mensal_id BIGINT;

  v_bim_inicio DATE;
  v_bim_fim DATE;
  v_bim_ids BIGINT[];
  v_bim_id BIGINT;

  v_sem_inicio DATE;
  v_sem_fim DATE;
  v_sem_ids BIGINT[];
  v_sem_id BIGINT;

  v_ano_inicio DATE;
  v_ano_fim DATE;
  v_ano_ids BIGINT[];
BEGIN
  -- 1) MENSAL: sempre gera o mês que acabou de fechar
  v_mes_inicio := date_trunc('month', now() - interval '1 month')::date;
  v_mes_fim := (v_mes_inicio + interval '1 month')::date;
  v_mes_num := EXTRACT(month FROM v_mes_inicio)::int;
  v_ano := EXTRACT(year FROM v_mes_inicio)::int;

  INSERT INTO public.relatorios_periodicos (tipo, ano, periodo_inicio, periodo_fim, periodo_label, dados)
  VALUES (
    'mensal', v_ano, v_mes_inicio, v_mes_fim,
    meses_pt[v_mes_num] || '/' || v_ano::text,
    public.fn_agregar_audit_logs(v_mes_inicio::timestamptz, v_mes_fim::timestamptz)
  )
  ON CONFLICT (tipo, periodo_inicio, periodo_fim) DO NOTHING
  RETURNING id INTO v_mensal_id;

  -- 2) BIMESTRAL: só quando o mês fechado completa um par (Fev, Abr, Jun, Ago, Out, Dez)
  IF v_mes_num % 2 = 0 THEN
    v_bim_inicio := (v_mes_inicio - interval '1 month')::date;
    v_bim_fim := v_mes_fim;

    SELECT array_agg(id) INTO v_bim_ids
    FROM public.relatorios_periodicos
    WHERE tipo = 'mensal' AND periodo_inicio >= v_bim_inicio AND periodo_fim <= v_bim_fim;

    IF v_bim_ids IS NOT NULL AND array_length(v_bim_ids, 1) = 2 THEN
      INSERT INTO public.relatorios_periodicos (tipo, ano, periodo_inicio, periodo_fim, periodo_label, dados)
      VALUES (
        'bimestral', v_ano, v_bim_inicio, v_bim_fim,
        meses_abrev_pt[v_mes_num - 1] || '-' || meses_abrev_pt[v_mes_num] || '/' || v_ano::text,
        public.fn_somar_dados_relatorios(v_bim_ids)
      )
      ON CONFLICT (tipo, periodo_inicio, periodo_fim) DO NOTHING
      RETURNING id INTO v_bim_id;
    END IF;
  END IF;

  -- 3) SEMESTRAL: só quando o bimestral fechado completa Jun ou Dez
  IF v_mes_num IN (6, 12) THEN
    v_sem_inicio := (make_date(v_ano, CASE WHEN v_mes_num = 6 THEN 1 ELSE 7 END, 1));
    v_sem_fim := v_mes_fim;

    SELECT array_agg(id) INTO v_sem_ids
    FROM public.relatorios_periodicos
    WHERE tipo = 'bimestral' AND periodo_inicio >= v_sem_inicio AND periodo_fim <= v_sem_fim;

    IF v_sem_ids IS NOT NULL AND array_length(v_sem_ids, 1) = 3 THEN
      INSERT INTO public.relatorios_periodicos (tipo, ano, periodo_inicio, periodo_fim, periodo_label, dados)
      VALUES (
        'semestral', v_ano, v_sem_inicio, v_sem_fim,
        (CASE WHEN v_mes_num = 6 THEN 'Jan-Jun' ELSE 'Jul-Dez' END) || '/' || v_ano::text,
        public.fn_somar_dados_relatorios(v_sem_ids)
      )
      ON CONFLICT (tipo, periodo_inicio, periodo_fim) DO NOTHING
      RETURNING id INTO v_sem_id;
    END IF;
  END IF;

  -- 4) ANUAL: só quando o semestral fechado é o de Jul-Dez (fecha o ano)
  IF v_mes_num = 12 THEN
    v_ano_inicio := make_date(v_ano, 1, 1);
    v_ano_fim := make_date(v_ano + 1, 1, 1);

    SELECT array_agg(id) INTO v_ano_ids
    FROM public.relatorios_periodicos
    WHERE tipo = 'semestral' AND periodo_inicio >= v_ano_inicio AND periodo_fim <= v_ano_fim;

    IF v_ano_ids IS NOT NULL AND array_length(v_ano_ids, 1) = 2 THEN
      INSERT INTO public.relatorios_periodicos (tipo, ano, periodo_inicio, periodo_fim, periodo_label, dados)
      VALUES (
        'anual', v_ano, v_ano_inicio, v_ano_fim,
        v_ano::text,
        public.fn_somar_dados_relatorios(v_ano_ids)
      )
      ON CONFLICT (tipo, periodo_inicio, periodo_fim) DO NOTHING;
    END IF;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.fn_gerar_relatorios_periodicos() IS
  'Fase 7: gera relatórios em cascata (mensal sempre; bimestral/semestral/anual quando o calendário fecha o bloco), agendado via pg_cron todo dia 05. Criado em 04/09/2026.';

-- Agendamento: todo dia 05 às 03:00 (horário do servidor Postgres, UTC por padrão no Supabase)
SELECT cron.schedule(
  'gerar-relatorios-periodicos',
  '0 3 5 * *',
  $$ SELECT public.fn_gerar_relatorios_periodicos(); $$
);
