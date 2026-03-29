# Supabase Schema — Veridia Saber

> **Última atualização:** 2026-03-29

Este documento descreve o schema do banco de dados PostgreSQL hospedado no Supabase, utilizado pelo painel administrativo Veridia Saber. Inclui a definição de todas as tabelas, views, funções auxiliares de segurança (RLS), buckets de storage e o sistema de roles (RBAC).

---

## 📊 Tabelas

### admin_notifications
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | - |
| user_id | uuid | YES | - |
| message | text | NO | - |
| is_read | boolean | YES | false |
| created_at | timestamp with time zone | YES | now() |
| local_id | bigint | YES | - |
| status | text | YES | 'pending' |

*Armazena notificações direcionadas a administradores e gestores, com controle de leitura e vínculo opcional a um projeto.*

---

### analytics_events
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| user_id | uuid | YES | - |
| event_type | text | NO | - |
| event_data | jsonb | YES | - |
| session_id | text | YES | - |
| platform | text | YES | - |
| app_version | text | YES | - |
| created_at | timestamp with time zone | YES | now() |

*Registra eventos de analytics enviados pelo app mobile, incluindo tipo de evento, dados arbitrários em JSON, plataforma e versão do app.*

---

### audit_logs
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | - |
| user_id | uuid | YES | - |
| action_type | text | NO | - |
| table_name | text | NO | - |
| record_id | text | YES | - |
| details | text | YES | - |
| created_at | timestamp with time zone | NO | now() |
| action | text | YES | - |
| old_data | jsonb | YES | - |
| new_data | jsonb | YES | - |

*Registra alterações realizadas no sistema para fins de auditoria. Armazena o estado anterior (`old_data`) e posterior (`new_data`) do registro modificado.*

---

### beta_testers
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| email | text | NO | - |
| name | text | YES | - |
| added_at | timestamp with time zone | YES | now() |
| downloaded_at | timestamp with time zone | YES | - |
| is_active | boolean | YES | true |

*Controla a lista de testadores beta do app mobile, rastreando se o download foi realizado.*

---

### colecao_imagens
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | - |
| planta_colecao_id | uuid | NO | - |
| url_imagem | text | NO | - |
| created_at | timestamp with time zone | NO | now() |

*Armazena URLs de imagens vinculadas a plantas de coleções criadas por usuários no app mobile.*

---

### colecoes
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | YES | - |
| descricao | text | YES | - |
| created_at | timestamp with time zone | NO | now() |
| nome_colecao | text | NO | 'Minha Coleção' |
| imagem_capa | text | YES | - |
| institution_id | uuid | YES | - |

*Coleções pessoais de plantas criadas por usuários do app mobile. Cada coleção pertence a um usuário e pode estar vinculada a uma instituição.*

---

### conteudo_orgaos
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | - |
| orgao | text | NO | - |
| titulo | text | NO | - |
| conteudo | text | YES | - |
| ordem | integer | NO | 0 |

*Conteúdo educacional organizado por órgão botânico (Raiz, Caule, Folha, Flor, Fruto, Semente). Gerenciado pelo editor TipTap no painel admin.*

---

### especie
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | text | NO | gen_random_uuid()::text |
| familia_id | text | YES | - |
| nome_cientifico | text | NO | - |
| nome_popular | text | YES | - |
| descricao_especie | text | YES | - |
| cuidados_luz | text | YES | - |
| cuidados_temperatura | text | YES | - |
| cuidados_agua | text | YES | - |
| cuidados_nutrientes | text | YES | - |
| cuidados_substrato | text | YES | - |
| created_at | timestamp with time zone | NO | now() |
| familia_custom | text | YES | - |
| created_by_institution_id | uuid | YES | - |
| created_by | uuid | YES | - |
| local_id | bigint | YES | - |
| autor | text | YES | - |
| **created_by_name** | text | YES | - |

*Registro taxonômico global de uma espécie vegetal. Contém dados científicos, nome popular, descrição e guia de cultivo. Cada espécie é cadastrada uma única vez no sistema.*

> ℹ️ A coluna `familia_custom` é utilizada quando a família não existe na tabela `familia` e precisa ser informada como texto livre.

---

### especie_local
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | - |
| especie_id | text | NO | - |
| local_id | bigint | NO | - |
| detalhes_localizacao | text | YES | - |
| created_at | timestamp with time zone | NO | now() |
| latitude | double precision | YES | - |
| longitude | double precision | YES | - |
| descricao_ocorrencia | text | YES | - |
| institution_id | uuid | NO | - |
| nome_popular_local | text | YES | - |
| determinador | text | YES | - |
| data_determinacao | date | YES | - |
| coletor | text | YES | - |
| numero_coletor | text | YES | - |
| morfologia | text | YES | - |
| habitat_ecologia | text | YES | - |
| created_by | uuid | YES | - |

*Ocorrência georreferenciada de uma espécie em um local específico (espécime). Cada registro vincula uma espécie a um projeto com coordenadas GPS e dados de coleta.*

> ℹ️ A VIEW `especime` é o alias semântico desta tabela e deve ser usada como nome padrão para consultas geográficas e camadas de mapa.

---

### estados
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | - |
| nome | text | NO | - |
| uf | character(2) | NO | - |

*Tabela de referência com os estados brasileiros (UF). Utilizada para geolocalização de plantas de coleções.*

---

### etiquetas
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| especie_local_id | bigint | NO | - |
| created_at | timestamp with time zone | NO | now() |
| gerado_por | uuid | YES | - |
| conteudo_json | jsonb | YES | - |
| numero_tombo | bigint | YES | - |

*Etiquetas de herbário geradas para espécimes. Contém o conteúdo estruturado em JSON e número de tombo para identificação física.*

---

### familia
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | text | NO | gen_random_uuid()::text |
| familia_nome | text | NO | - |
| autoria_taxonomica | text | YES | - |
| created_at | timestamp with time zone | NO | now() |
| distribuicao_geografica | text | YES | - |
| imagem_referencia | text | YES | - |
| caracteristicas | text | YES | - |
| fonte_referencia | text | YES | - |
| link_referencia | text | YES | - |
| descricao_familia | text | YES | - |
| created_by_institution_id | uuid | YES | - |
| created_by | uuid | YES | auth.uid() |
| **created_by_name** | text | YES | - |

*Família botânica segundo o sistema de classificação APG. Contém dados taxonômicos, distribuição geográfica e referências bibliográficas.*

---

### familia_nomenclatura_legado
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| familia_id | text | NO | - |
| nome_legado | text | NO | - |
| tipo | text | YES | 'sinonimo' |
| fonte | text | YES | - |
| observacao | text | YES | - |
| created_at | timestamp with time zone | NO | now() |

*Nomes legados e sinônimos de famílias botânicas (ex: nomenclatura pré-APG). Permite rastrear correspondências históricas.*

---

### imagens
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| created_at | timestamp with time zone | YES | now() |
| especie_id | text | YES | - |
| url_imagem | text | NO | - |
| creditos | text | YES | - |
| institution_id | uuid | YES | - |
| especie_local_id | bigint | YES | - |
| criado_por | text | YES | - |
| local_id | bigint | YES | - |
| **especime_id** | bigint | YES | - |

*Imagens associadas a espécies ou espécimes. Cada imagem pertence exclusivamente a uma espécie OU a um espécime, nunca a ambos.*

> ℹ️ **Constraint CHECK**: `(especie_id IS NOT NULL AND especime_id IS NULL) OR (especie_id IS NULL AND especime_id IS NOT NULL)` — garante que cada imagem esteja vinculada a exatamente uma das duas entidades.

---

### institutions
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO | - |
| logo_url | text | YES | - |
| created_at | timestamp with time zone | NO | timezone('utc', now()) |

*Instituições parceiras do sistema (universidades, jardins botânicos, ONGs). Serve como entidade raiz para multitenancy.*

---

### locais
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | - |
| nome | text | NO | - |
| descricao | text | YES | - |
| imagem_capa | text | YES | - |
| created_at | timestamp with time zone | NO | now() |
| tipo | text | YES | - |
| institution_id | uuid | NO | - |
| historia | text | YES | - |
| endereco | text | YES | - |
| cidade | text | YES | - |
| estado | text | YES | - |
| contato | text | YES | - |
| latitude | numeric | YES | - |
| longitude | numeric | YES | - |
| gestor_id | uuid | YES | - |

*Projetos de campo / locais de coleta. Cada local pertence a uma instituição e pode ter um gestor responsável. É a unidade de escopo para permissões locais (RBAC).*

---

### municipios
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | - |
| nome | text | NO | - |
| estado_id | integer | NO | - |

*Tabela de referência com os municípios brasileiros, vinculados a um estado.*

---

### plantas_da_colecao
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | YES | - |
| colecao_id | uuid | NO | - |
| familia_id | text | YES | - |
| anotacoes | text | YES | - |
| latitude | numeric | YES | - |
| longitude | numeric | YES | - |
| data_registro | date | NO | - |
| created_at | timestamp with time zone | NO | now() |
| fotos | jsonb | NO | '[]' |
| nome_popular | text | YES | - |
| familia_custom | text | YES | - |
| especie | text | YES | - |
| institution_id | uuid | YES | - |
| estado_id | integer | YES | - |
| municipio_id | integer | YES | - |

*Plantas individuais adicionadas a uma coleção pelo usuário do app mobile. Inclui geolocalização, família botânica e fotos em formato JSON.*

---

### profiles
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | - |
| email | text | YES | - |
| role | text | YES | 'Consulente' |
| created_at | timestamp with time zone | YES | now() |
| username | text | YES | - |
| full_name | text | YES | - |
| avatar_url | text | YES | - |
| institution_id | uuid | YES | - |
| local_id | bigint | YES | - |

*Perfil do usuário autenticado. Estende a tabela `auth.users` do Supabase com dados de exibição e controle de acesso (role + local_id).*

> ⚠️ **Atenção**: O valor default da coluna `role` é `'Consulente'` (nome de exibição), enquanto as funções RLS e a view `user_roles_display` esperam valores técnicos como `super_admin`, `admin`, `catalogador`. Veja a seção [Pendências Conhecidas](#%EF%B8%8F-pendências-conhecidas).

---

## 🔗 Foreign Keys (Relacionamentos)

| Tabela Origem | Coluna | Tabela Destino | Coluna Destino |
|---------------|--------|----------------|----------------|
| admin_notifications | local_id | locais | id |
| admin_notifications | user_id | profiles | id |
| audit_logs | user_id | profiles | id |
| colecao_imagens | planta_colecao_id | plantas_da_colecao | id |
| colecoes | institution_id | institutions | id |
| especie | created_by_institution_id | institutions | id |
| especie | familia_id | familia | id |
| especie | local_id | locais | id |
| especie_local | especie_id | especie | id |
| especie_local | institution_id | institutions | id |
| especie_local | local_id | locais | id |
| etiquetas | especie_local_id | especie_local | id |
| familia | created_by_institution_id | institutions | id |
| familia_nomenclatura_legado | familia_id | familia | id |
| imagens | especie_id | especie | id |
| imagens | especie_local_id | especie_local | id |
| imagens | institution_id | institutions | id |
| imagens | local_id | locais | id |
| imagens | **especime_id** | especie_local | id |
| locais | institution_id | institutions | id |
| municipios | estado_id | estados | id |
| plantas_da_colecao | colecao_id | colecoes | id |
| plantas_da_colecao | estado_id | estados | id |
| plantas_da_colecao | familia_id | familia | id |
| plantas_da_colecao | institution_id | institutions | id |
| plantas_da_colecao | municipio_id | municipios | id |
| profiles | institution_id | institutions | id |
| profiles | local_id | locais | id |

---

## 👁️ Views

### analytics_daily_active_users

*Agrega o número de usuários distintos ativos por dia nos últimos 30 dias. Utilizada no dashboard de analytics do painel admin.*

```sql
SELECT date(created_at) AS date,
    count(DISTINCT user_id) AS active_users
FROM analytics_events
WHERE (created_at > (now() - '30 days'::interval))
GROUP BY (date(created_at))
ORDER BY (date(created_at)) DESC;
```

---

### analytics_events_summary

*Resume os tipos de eventos e a contagem de usuários únicos nos últimos 7 dias. Utilizada para o overview de engajamento no painel admin.*

```sql
SELECT event_type,
    count(*) AS count,
    count(DISTINCT user_id) AS unique_users
FROM analytics_events
WHERE (created_at > (now() - '7 days'::interval))
GROUP BY event_type
ORDER BY (count(*)) DESC;
```

---

### locais_estatisticas

*Calcula o total de espécies e famílias distintas por local/projeto. Utilizada nos cards de estatísticas da tela de detalhes do projeto.*

```sql
SELECT l.id AS local_id,
    count(DISTINCT el.especie_id) AS total_especies,
    count(DISTINCT e.familia_id) AS total_familias
FROM ((locais l
    LEFT JOIN especie_local el ON ((l.id = el.local_id)))
    LEFT JOIN especie e ON ((el.especie_id = e.id)))
GROUP BY l.id;
```

---

### user_roles_display

*Converte as roles técnicas em nomes de exibição amigáveis com base na combinação `role` + `local_id`. Utilizada na listagem de usuários do painel admin.*

```sql
SELECT id, full_name, email, role, local_id,
    CASE
        WHEN (role = 'super_admin') THEN 'Curador Mestre'
        WHEN (role = 'admin' AND local_id IS NULL) THEN 'Coordenador Científico'
        WHEN (role = 'admin' AND local_id IS NOT NULL) THEN 'Gestor de Acervo'
        WHEN (role = 'catalogador' AND local_id IS NULL) THEN 'Taxonomista Sênior'
        WHEN (role = 'catalogador' AND local_id IS NOT NULL) THEN 'Taxonomista de Campo'
        ELSE 'Consulente'
    END AS cargo_display
FROM profiles;
```

---

### view_pendentes_oficial

*Lista espécies que ainda não possuem nenhuma imagem cadastrada. Utilizada como fila de trabalho para upload de fotos no painel admin.*

```sql
SELECT id, familia_id, nome_cientifico, nome_popular, descricao_especie,
    cuidados_luz, cuidados_temperatura, cuidados_agua, cuidados_nutrientes,
    cuidados_substrato, created_at, familia_custom, created_by_institution_id,
    (SELECT i.url_imagem FROM imagens i WHERE i.especie_id = e.id ORDER BY i.created_at DESC LIMIT 1) AS foto_provisoria
FROM especie e
WHERE NOT EXISTS (SELECT 1 FROM imagens i WHERE i.especie_id = e.id);
```

---

### especime (VIEW)

*Alias semântico da tabela `especie_local`. Deve ser utilizada como nome padrão para consultas geográficas, camadas de mapa e referências a ocorrências de campo, separando conceitualmente o espécime (ocorrência física) da espécie (registro taxonômico).*

| Coluna |
|--------|
| id |
| especie_id |
| local_id |
| institution_id |
| latitude |
| longitude |
| detalhes_localizacao |
| descricao_ocorrencia |
| nome_popular_local |
| determinador |
| data_determinacao |
| coletor |
| numero_coletor |
| morfologia |
| habitat_ecologia |
| created_at |
| created_by |

---

## 🛡️ Funções Auxiliares de Segurança (RLS)

Funções utilizadas nas políticas de Row Level Security (RLS) para determinar o nível de acesso do usuário autenticado.

### `public.is_staff()`

Retorna `true` se o usuário autenticado possuir uma das seguintes roles:

- `super_admin`
- `admin`
- `catalogador`
- `curador`
- `coordenador`

```sql
-- Pseudocódigo da implementação
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'catalogador', 'curador', 'coordenador')
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

> ⚠️ **Problema conhecido**: Esta função compara `profiles.role` com valores em lowercase (`'super_admin'`, `'admin'`, etc.), porém a coluna `profiles.role` pode conter nomes de exibição como `'Curador Mestre'` ou `'Coordenador Científico'`. Consulte a seção [Pendências Conhecidas](#%EF%B8%8F-pendências-conhecidas).

---

### `public.is_admin()`

Retorna `true` se o usuário autenticado possuir uma das seguintes roles:

- `super_admin`
- `admin`

```sql
-- Pseudocódigo da implementação
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 📦 Storage Buckets

| ID | Nome | Público | Uso |
|----|------|---------|-----|
| imagens_conteudo | imagens_conteudo | ✅ | Imagens inline inseridas pelo editor TipTap no painel de Conteúdo Educativo |
| fotos-das-colecoes | fotos-das-colecoes | ✅ | Fotos de plantas enviadas pelos usuários do app mobile para suas coleções |
| arquivos-gerais | arquivos-gerais | ✅ | Arquivos organizados por órgão botânico (Raiz, Caule, Folha, Flor, Fruto, Semente, Outros) |
| imagens-plantas | imagens-plantas | ✅ | Imagens das fichas de espécies cadastradas no catálogo botânico |

---

## 🔐 Roles do Sistema

| Role Técnica | Nome de Exibição | Escopo | Acesso ao Painel Admin |
|--------------|------------------|--------|------------------------|
| super_admin | Curador Mestre | Global | ✅ Total — gestão de usuários, dados e configurações |
| admin (local_id = NULL) | Coordenador Científico | Global | ✅ Total — exceto gestão de super admins |
| admin (local_id ≠ NULL) | Gestor de Acervo | Local | ✅ Restrito ao projeto vinculado |
| catalogador (local_id = NULL) | Taxonomista Sênior | Global | ✅ Cadastro e edição de espécies e espécimes |
| catalogador (local_id ≠ NULL) | Taxonomista de Campo | Local | ✅ Cadastro e edição no projeto vinculado |
| - | Consulente | Read-only | ❌ Sem acesso ao painel — somente app mobile |

---

## ⚠️ Pendências Conhecidas

1. **Desincronização entre `is_staff()` e `profiles.role`**
   A função `is_staff()` compara a coluna `role` com valores técnicos em lowercase (`'super_admin'`, `'admin'`, `'catalogador'`, `'curador'`, `'coordenador'`), porém o default da coluna `profiles.role` é `'Consulente'` (nome de exibição em PascalCase). Se novos usuários forem criados sem que a role seja explicitamente definida com o valor técnico, as políticas RLS podem não reconhecê-los como staff. **Ação recomendada**: padronizar os valores da coluna `role` para usar exclusivamente as roles técnicas em lowercase e ajustar a view `user_roles_display` para fazer a tradução para nomes de exibição.

2. **Coluna `especie_local_id` redundante na tabela `imagens`**
   A tabela `imagens` possui tanto `especie_local_id` quanto `especime_id`, ambas com FK para `especie_local.id`. Apenas `especime_id` deveria ser utilizada após a migração. A coluna `especie_local_id` pode ser removida depois que todas as referências no código forem atualizadas.

3. **Roles `curador` e `coordenador` na função `is_staff()`**
   A função `is_staff()` referencia roles `'curador'` e `'coordenador'` que não existem como valores válidos na tabela `profiles`. As roles reais são `super_admin` (Curador Mestre) e `admin` (Coordenador Científico). Esses valores na função são provavelmente resquícios de uma nomenclatura anterior e devem ser removidos.
