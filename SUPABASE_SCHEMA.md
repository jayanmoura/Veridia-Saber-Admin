# Supabase Schema - Veridia Saber

> Última atualização: 2026-01-23

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

---

### colecao_imagens
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | - |
| planta_colecao_id | uuid | NO | - |
| url_imagem | text | NO | - |
| created_at | timestamp with time zone | NO | now() |

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

---

### conteudo_orgaos
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | bigint | NO | - |
| orgao | text | NO | - |
| titulo | text | NO | - |
| conteudo | text | YES | - |
| ordem | integer | NO | 0 |

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

---

### estados
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | - |
| nome | text | NO | - |
| uf | character(2) | NO | - |

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

---

### familia
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | text | NO | gen_random_uuid()::text |
| familia_nome | text | NO | - |
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

---

### institutions
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO | - |
| logo_url | text | YES | - |
| created_at | timestamp with time zone | NO | timezone('utc', now()) |

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

---

### municipios
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | integer | NO | - |
| nome | text | NO | - |
| estado_id | integer | NO | - |

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
| imagens | especie_id | especie | id |
| imagens | especie_local_id | especie_local | id |
| imagens | institution_id | institutions | id |
| imagens | local_id | locais | id |
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
```sql
SELECT date(created_at) AS date,
    count(DISTINCT user_id) AS active_users
FROM analytics_events
WHERE (created_at > (now() - '30 days'::interval))
GROUP BY (date(created_at))
ORDER BY (date(created_at)) DESC;
```

### analytics_events_summary
```sql
SELECT event_type,
    count(*) AS count,
    count(DISTINCT user_id) AS unique_users
FROM analytics_events
WHERE (created_at > (now() - '7 days'::interval))
GROUP BY event_type
ORDER BY (count(*)) DESC;
```

### locais_estatisticas
```sql
SELECT l.id AS local_id,
    count(DISTINCT el.especie_id) AS total_especies,
    count(DISTINCT e.familia_id) AS total_familias
FROM ((locais l
    LEFT JOIN especie_local el ON ((l.id = el.local_id)))
    LEFT JOIN especie e ON ((el.especie_id = e.id)))
GROUP BY l.id;
```

### user_roles_display
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

### view_pendentes_oficial
```sql
SELECT id, familia_id, nome_cientifico, nome_popular, descricao_especie,
    cuidados_luz, cuidados_temperatura, cuidados_agua, cuidados_nutrientes,
    cuidados_substrato, created_at, familia_custom, created_by_institution_id,
    (SELECT i.url_imagem FROM imagens i WHERE i.especie_id = e.id ORDER BY i.created_at DESC LIMIT 1) AS foto_provisoria
FROM especie e
WHERE NOT EXISTS (SELECT 1 FROM imagens i WHERE i.especie_id = e.id);
```

---

## 📦 Storage Buckets

| ID | Nome | Público |
|----|------|---------|
| imagens_conteudo | imagens_conteudo | ✅ |
| fotos-das-colecoes | fotos-das-colecoes | ✅ |
| arquivos-gerais | arquivos-gerais | ✅ |
| imagens-plantas | imagens-plantas | ✅ |

---

## 🔐 Roles do Sistema

| Role Técnica | Nome de Exibição | Escopo |
|--------------|------------------|--------|
| super_admin | Curador Mestre | Global |
| admin (local_id = NULL) | Coordenador Científico | Global |
| admin (local_id ≠ NULL) | Gestor de Acervo | Local |
| catalogador (local_id = NULL) | Taxonomista Sênior | Global |
| catalogador (local_id ≠ NULL) | Taxonomista de Campo | Local |
| - | Consulente | Read-only |
