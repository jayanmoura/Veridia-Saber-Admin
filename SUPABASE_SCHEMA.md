# Supabase Database Schema & Storage

## 🗄️ Tables and Columns

| Tabela | Coluna | Tipo de Dado | Aceita Nulo |
| :--- | :--- | :--- | :--- |
| **admin_notifications** | id | bigint | NO |
| | user_id | uuid | YES |
| | message | text | NO |
| | is_read | boolean | YES |
| | created_at | timestamp with time zone | YES |
| | local_id | bigint | YES |
| | status | text | YES |
| **audit_logs** | id | bigint | NO |
| | user_id | uuid | YES |
| | action_type | text | NO |
| | table_name | text | NO |
| | record_id | text | YES |
| | details | text | YES |
| | created_at | timestamp with time zone | NO |
| **colecao_imagens** | id | bigint | NO |
| | planta_colecao_id | uuid | NO |
| | url_imagem | text | NO |
| | created_at | timestamp with time zone | NO |
| **colecoes** | id | uuid | NO |
| | user_id | uuid | NO |
| | descricao | text | YES |
| | created_at | timestamp with time zone | NO |
| | nome_colecao | text | NO |
| | imagem_capa | text | YES |
| | institution_id | uuid | NO |
| **conteudo_orgaos** | id | bigint | NO |
| | orgao | text | NO |
| | titulo | text | NO |
| | conteudo | text | YES |
| | ordem | integer | NO |
| **especie** | id | text | NO |
| | familia_id | text | YES |
| | nome_cientifico | text | NO |
| | nome_popular | text | YES |
| | descricao_especie | text | YES |
| | cuidados_luz | text | YES |
| | cuidados_temperatura | text | YES |
| | cuidados_agua | text | YES |
| | cuidados_nutrientes | text | YES |
| | cuidados_substrato | text | YES |
| | created_at | timestamp with time zone | NO |
| | familia_custom | text | YES |
| | created_by_institution_id | uuid | YES |
| | created_by | uuid | YES |
| | local_id | bigint | YES |
| **especie_imagens** | id | bigint | NO |
| | especie_id | text | NO |
| | url_imagem | text | NO |
| | created_at | timestamp with time zone | NO |
| | creditos | text | YES |
| **especie_local** | id | bigint | NO |
| | especie_id | text | NO |
| | local_id | bigint | NO |
| | detalhes_localizacao | text | YES |
| | created_at | timestamp with time zone | NO |
| | latitude | double precision | YES |
| | longitude | double precision | YES |
| | descricao_ocorrencia | text | YES |
| | institution_id | uuid | NO |
| | nome_popular_local | text | YES |
| **estados** | id | integer | NO |
| | nome | text | NO |
| | uf | character | NO |
| **familia** | id | text | NO |
| | familia_nome | text | NO |
| | created_at | timestamp with time zone | NO |
| | distribuicao_geografica | text | YES |
| | imagem_referencia | text | YES |
| | caracteristicas | text | YES |
| | fonte_referencia | text | YES |
| | link_referencia | text | YES |
| | descricao_familia | text | YES |
| | created_by_institution_id | uuid | YES |
| **family_requests** | id | bigint | NO |
| | requester_id | uuid | YES |
| | family_name | text | NO |
| | status | text | YES |
| | created_at | timestamp with time zone | YES |
| **imagens** | id | uuid | NO |
| | created_at | timestamp with time zone | YES |
| | especie_id | text | YES |
| | url_imagem | text | NO |
| | creditos | text | YES |
| | institution_id | uuid | YES |
| | especie_local_id | bigint | YES |
| | criado_por | text | YES |
| | local_id | bigint | YES |
| **institutions** | id | uuid | NO |
| | name | text | NO |
| | logo_url | text | YES |
| | created_at | timestamp with time zone | NO |
| **locais** | id | bigint | NO |
| | nome | text | NO |
| | descricao | text | YES |
| | imagem_capa | text | YES |
| | created_at | timestamp with time zone | NO |
| | tipo | text | YES |
| | institution_id | uuid | NO |
| | historia | text | YES |
| | endereco | text | YES |
| | cidade | text | YES |
| | estado | text | YES |
| | contato | text | YES |
| **locais_estatisticas** | local_id | bigint | YES |
| | total_especies | bigint | YES |
| | total_familias | bigint | YES |
| **municipios** | id | integer | NO |
| | nome | text | NO |
| | estado_id | integer | NO |
| **plantas_da_colecao** | id | uuid | NO |
| | user_id | uuid | NO |
| | colecao_id | uuid | NO |
| | familia_id | text | YES |
| | anotacoes | text | YES |
| | latitude | numeric | YES |
| | longitude | numeric | YES |
| | data_registro | date | NO |
| | created_at | timestamp with time zone | NO |
| | fotos | jsonb | NO |
| | nome_popular | text | YES |
| | familia_custom | text | YES |
| | especie | text | YES |
| | institution_id | uuid | YES |
| | estado_id | integer | YES |
| | municipio_id | integer | YES |
| **profiles** | id | uuid | NO |
| | email | text | YES |
| | role | text | YES |
| | created_at | timestamp with time zone | YES |
| | username | text | YES |
| | full_name | text | YES |
| | avatar_url | text | YES |
| | institution_id | uuid | YES |
| | local_id | bigint | YES |
| **user_roles_display** | id | uuid | YES |
| | full_name | text | YES |
| | email | text | YES |
| | role | text | YES |
| | local_id | bigint | YES |
| | cargo_display | text | YES |

---

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
