# 🗄️ Supabase Database Schema Documentation

> **Last Updated:** 2026-01-03
> **Status:** Production / Active Development

---

## 📋 Table of Contents

1.  [admin_notifications](#admin_notifications)
2.  [audit_logs](#audit_logs)
3.  [beta_testers](#beta_testers)
4.  [colecoes](#colecoes)
5.  [colecao_imagens](#colecao_imagens)
6.  [conteudo_orgaos](#conteudo_orgaos)
7.  [especie](#especie)
8.  [especie_local](#especie_local)
9.  [especie_imagens](#especie_imagens) *(Nota: Tabela mencionada em logs anteriores, verifique se ainda está ativa ou foi substituída por 'imagens')*
10. [estados](#estados)
11. [familia](#familia)
12. [family_requests](#family_requests) *(Nota: Tabela de requisições)*
13. [imagens](#imagens)
14. [institutions](#institutions)
15. [locais](#locais)
16. [locais_estatisticas](#locais_estatisticas)
17. [municipios](#municipios)
18. [plantas_da_colecao](#plantas_da_colecao)
19. [profiles](#profiles)
20. [user_roles_display](#user_roles_display) *(View)*
21. [view_pendentes_oficial](#view_pendentes_oficial) *(View)*

---

## 📊 Tables & Structures

### admin_notifications
Notificações do sistema para administradores.

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `bigint` | NO | - | - |
| user_id | `uuid` | YES | - | -> `profiles.id` |
| message | `text` | NO | - | - |
| is_read | `boolean` | YES | `false` | - |
| created_at | `timestamptz` | YES | `now()` | - |
| local_id | `bigint` | YES | - | -> `locais.id` |
| status | `text` | YES | `'pending'` | - |

### audit_logs
Registro de auditoria para segurança e rastreabilidade.

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `bigint` | NO | - | - |
| user_id | `uuid` | YES | - | -> `profiles.id` |
| action_type | `text` | NO | - | - |
| table_name | `text` | NO | - | - |
| record_id | `text` | YES | - | - |
| details | `text` | YES | - | - |
| created_at | `timestamptz` | NO | `now()` | - |
| action | `text` | YES | - | - |
| old_data | `jsonb` | YES | - | - |
| new_data | `jsonb` | YES | - | - |

### beta_testers
Lista de controle para acesso antecipado.

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `uuid` | NO | `gen_random_uuid()` | - |
| email | `text` | NO | - | - |
| name | `text` | YES | - | - |
| added_at | `timestamptz` | YES | `now()` | - |
| downloaded_at | `timestamptz` | YES | - | - |
| is_active | `boolean` | YES | `true` | - |

### colecao_imagens
Imagens específicas das plantas dentro de coleções de usuários.

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `bigint` | NO | - | - |
| planta_colecao_id | `uuid` | NO | - | -> `plantas_da_colecao.id` |
| url_imagem | `text` | NO | - | - |
| created_at | `timestamptz` | NO | `now()` | - |

### colecoes
Agrupamentos de plantas criados por usuários.

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `uuid` | NO | `gen_random_uuid()` | - |
| user_id | `uuid` | NO | - | -> `auth.users` (Implicit) |
| descricao | `text` | YES | - | - |
| created_at | `timestamptz` | NO | `now()` | - |
| nome_colecao | `text` | NO | `'Minha Coleção'` | - |
| imagem_capa | `text` | YES | - | - |
| institution_id | `uuid` | NO | - | -> `institutions.id` |

### conteudo_orgaos
Conteúdo educativo sobre morfologia vegetal.

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `bigint` | NO | - | - |
| orgao | `text` | NO | - | - |
| titulo | `text` | NO | - | - |
| conteudo | `text` | YES | - | - |
| ordem | `integer` | NO | `0` | - |

### especie
Tabela mestre de espécies (Dados Globais/Taxonômicos).

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `text` | NO | `gen_random_uuid()` | - |
| familia_id | `text` | YES | - | -> `familia.id` |
| nome_cientifico | `text` | NO | - | - |
| nome_popular | `text` | YES | - | - |
| descricao_especie | `text` | YES | - | - |
| cuidados_luz | `text` | YES | - | - |
| cuidados_temperatura | `text` | YES | - | - |
| cuidados_agua | `text` | YES | - | - |
| cuidados_nutrientes | `text` | YES | - | - |
| cuidados_substrato | `text` | YES | - | - |
| created_at | `timestamptz` | NO | `now()` | - |
| familia_custom | `text` | YES | - | - |
| created_by_institution_id | `uuid` | YES | - | -> `institutions.id` |
| created_by | `uuid` | YES | - | -> `auth.users` (Implicit) |
| local_id | `bigint` | YES | - | -> `locais.id` |
| autor | `text` | YES | - | - |

### especie_local
Dados de ocorrência de uma espécie em um local específico (Xiloteca/Herbário).

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `bigint` | NO | - | - |
| especie_id | `text` | NO | - | -> `especie.id` |
| local_id | `bigint` | NO | - | -> `locais.id` |
| detalhes_localizacao | `text` | YES | - | - |
| created_at | `timestamptz` | NO | `now()` | - |
| latitude | `double` | YES | - | - |
| longitude | `double` | YES | - | - |
| descricao_ocorrencia | `text` | YES | - | - |
| institution_id | `uuid` | NO | - | -> `institutions.id` |
| nome_popular_local | `text` | YES | - | - |

### etiquetas
Registros de etiquetas de herbário geradas para espécies em projetos.

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `uuid` | NO | `gen_random_uuid()` | - |
| especie_local_id | `bigint` | NO | - | -> `especie_local.id` |
| created_at | `timestamptz` | NO | `now()` | - |
| gerado_por | `uuid` | YES | - | -> `auth.users` |
| conteudo_json | `jsonb` | YES | - | - |
| numero_tombo | `bigint` | YES | - | - |

### estados
Lista fixa de estados (UF).

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | NO | - | - |
| nome | `text` | NO | - | - |
| uf | `char` | NO | - | - |

### familia
Dados taxonômicos de famílias botânicas.

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `text` | NO | `gen_random_uuid()` | - |
| familia_nome | `text` | NO | - | - |
| created_at | `timestamptz` | NO | `now()` | - |
| distribuicao_geografica | `text` | YES | - | - |
| imagem_referencia | `text` | YES | - | - |
| caracteristicas | `text` | YES | - | - |
| fonte_referencia | `text` | YES | - | - |
| link_referencia | `text` | YES | - | - |
| descricao_familia | `text` | YES | - | - |
| created_by_institution_id | `uuid` | YES | - | -> `institutions.id` |
| created_by | `uuid` | YES | `auth.uid()` | -> `auth.users` (Implicit) |

### imagens
Banco central de imagens (Globais e Locais).

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `uuid` | NO | `gen_random_uuid()` | - |
| created_at | `timestamptz` | YES | `now()` | - |
| especie_id | `text` | YES | - | -> `especie.id` |
| url_imagem | `text` | NO | - | - |
| creditos | `text` | YES | - | - |
| institution_id | `uuid` | YES | - | -> `institutions.id` |
| especie_local_id | `bigint` | YES | - | -> `especie_local.id` |
| criado_por | `text` | YES | - | - |
| local_id | `bigint` | YES | - | -> `locais.id` |

### institutions
Instituições cadastradas (Ex: UFRRJ, Jardins Botânicos).

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `uuid` | NO | `gen_random_uuid()` | - |
| name | `text` | NO | - | - |
| logo_url | `text` | YES | - | - |
| created_at | `timestamptz` | NO | `now()` | - |

### locais
Locais físicos (Campus, Reservas, Prédios).

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `bigint` | NO | - | - |
| nome | `text` | NO | - | - |
| descricao | `text` | YES | - | - |
| imagem_capa | `text` | YES | - | - |
| created_at | `timestamptz` | NO | `now()` | - |
| tipo | `text` | YES | - | - |
| institution_id | `uuid` | NO | - | -> `institutions.id` |
| historia | `text` | YES | - | - |
| endereco | `text` | YES | - | - |
| cidade | `text` | YES | - | - |
| estado | `text` | YES | - | - |
| contato | `text` | YES | - | - |
| latitude | `double` | YES | - | - |
| longitude | `double` | YES | - | - |
| gestor_id | `uuid` | YES | - | -> `profiles.id` (ON DELETE SET NULL) |

### locais_estatisticas
Dados agregados para performance.

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| local_id | `bigint` | YES | - | - |
| total_especies | `bigint` | YES | - | - |
| total_familias | `bigint` | YES | - | - |

### municipios
Lista de municípios vinculada a estados.

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | NO | - | - |
| nome | `text` | NO | - | - |
| estado_id | `integer` | NO | - | -> `estados.id` |

### plantas_da_colecao
Registros individuais de plantas feitos pelos usuários (App).

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `uuid` | NO | `gen_random_uuid()` | - |
| user_id | `uuid` | NO | - | -> `auth.users` |
| colecao_id | `uuid` | NO | - | -> `colecoes.id` |
| familia_id | `text` | YES | - | -> `familia.id` |
| anotacoes | `text` | YES | - | - |
| latitude | `numeric` | YES | - | - |
| longitude | `numeric` | YES | - | - |
| data_registro | `date` | NO | - | - |
| created_at | `timestamptz` | NO | `now()` | - |
| fotos | `jsonb` | NO | `[]` | - |
| nome_popular | `text` | YES | - | - |
| familia_custom | `text` | YES | - | - |
| especie | `text` | YES | - | - |
| institution_id | `uuid` | YES | - | -> `institutions.id` |
| estado_id | `integer` | YES | - | -> `estados.id` |
| municipio_id | `integer` | YES | - | -> `municipios.id` |

### profiles
Dados públicos dos usuários.

| Coluna | Tipo | Nulo? | Default | Relação (FK) |
| :--- | :--- | :--- | :--- | :--- |
| **id** (PK) | `uuid` | NO | - | -> `auth.users` |
| email | `text` | YES | - | - |
| role | `text` | YES | `'user'` | - |
| created_at | `timestamptz` | YES | `now()` | - |
| username | `text` | YES | - | - |
| full_name | `text` | YES | - | - |
| avatar_url | `text` | YES | - | - |
| institution_id | `uuid` | YES | - | -> `institutions.id` |
| local_id | `bigint` | YES | - | -> `locais.id` |

### Views (Somente Leitura)

#### user_roles_display
Visualização simplificada para admin, juntando dados de perfil e roles.
* **Colunas:** id, full_name, email, role, local_id, cargo_display.

#### view_pendentes_oficial
Visualização para curadoria de espécies pendentes de revisão.
* **Colunas:** id, familia_id, nome_cientifico, nome_popular, descricao, cuidados, created_at, created_by_institution_id, foto_provisoria.

---

## 🏗️ Relacionamentos Principais (Resumo)

* **Hierarquia Taxonômica:** `especie` -> `familia`
* **Hierarquia Geográfica:** `municipios` -> `estados`
* **Estrutura Institucional:** `locais` -> `institutions`
* **Ocorrências:** `especie_local` conecta uma `especie` a um `local` (Many-to-Many via tabela pivô com dados extras).
* **Coleções de Usuário:** `plantas_da_colecao` -> `colecoes` -> `profiles`.


## 📦 Storage Buckets

| Bucket ID | Nome | Público |
| :--- | :--- | :--- |
| **imagens_conteudo** | imagens_conteudo | true |
| **fotos-das-colecoes** | fotos-das-colecoes | true |
| **arquivos-gerais** | arquivos-gerais | true |
| **imagens-plantas** | imagens-plantas | true |

---

## 🔑 Key Relationships Logic (Architecture)

1. **Species Global vs Local:**
   - `especie`: Stores global/canonical data (Scientific Name, Botanical Description).
   - `especie_local`: Stores project-specific data (Occurrence Description, Location Details). Links `especie.id` to `locais.id`.

2. **Images Context:**
   - Table `imagens` is the main source for species photos.
   - It links to a species via `especie_id`.
   - It links to a project via `local_id`.
   - **Logic:** If `local_id` is present, the image belongs to that project's gallery. If `local_id` is NULL, it's a global/Veridia image.
