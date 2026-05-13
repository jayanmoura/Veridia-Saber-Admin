---

# SESSOES-VERIDIASABER-ADMIN.md
> Registro de sessões de trabalho no painel admin e landing page Veridia Saber.
> Cada entrada documenta o que foi feito, decisões tomadas e pendências abertas.
> Mantido para orientar Claude e agentes de IA na retomada de contexto entre sessões.

---

## Como usar este arquivo
- Ao iniciar uma sessão: leia as últimas 2-3 entradas para ter contexto
- Ao encerrar uma sessão: adicione uma nova entrada no topo
- Formato de cada entrada abaixo

---

## Sessão 09/05/2026

### O que foi feito
- Instalado e configurado Graphify no painel admin
- Gerado GRAPH_REPORT.md do admin (832 nodes, 1280 edges, 73 communities)
- Identificado e documentado falso positivo: initializePDFLogo() → StrategyHandler (aresta INFERRED sem acoplamento real)
- Identificado redundância: initializePDFLogo() auto-executada em core.ts E index.ts
- Atualizado INFRA-VERIDIASABER.md com seção 18 sobre Graphify

### Decisões tomadas
- Arestas INFERRED do Graphify tratadas com ceticismo — apenas EXTRACTED são confiáveis
- dev/dist/ deve ser excluído do corpus para evitar falsos positivos com artefatos Workbox

### Pendências abertas
- [ ] Validar especie INSERT with_check (created_by IS NULL) contra fluxo do app mobile
- [ ] Criar projeto VeridiaSaber-Staging no Supabase (plano premium) para Playwright E2E
- [ ] Re-upload de imagens das 4 famílias (Acanthaceae, Euphorbiaceae, Fabaceae, Myrtaceae)
- [ ] Centralizar initializePDFLogo() em único ponto (baixa urgência)

### Arquivos alterados
- INFRA-VERIDIASABER.md (seção 18 adicionada)
- GRAPH_REPORT.md (gerado pelo graphify)

---

## Sessão 19/04/2026

### O que foi feito
- Auditoria completa de segurança RLS
- Corrigida função is_admin() — removidos aliases legados super_admin e admin
- Deletada Edge Function backfill-image-sizes (exposta sem JWT)
- Reescritas policies de storage: fotos-das-colecoes e imagens_conteudo
- Corrigida policy profiles SELECT (restrita a authenticated)
- Removidos UPDATE/DELETE públicos de beta_testers

### Decisões tomadas
- DROP POLICY IF EXISTS obrigatório antes de recriar — Supabase permite policies duplicadas silenciosamente
- Migrations sequenciais nomeadas (00N_descricao.sql) como padrão — fix_*.sql no .gitignore

### Pendências abertas
- [ ] especie INSERT with_check allows created_by IS NULL — validar antes de corrigir
- [ ] Playwright E2E aguarda staging

### Arquivos alterados
- supabase/migrations/ (várias migrations de segurança)
- INFRA-VERIDIASABER.md (seção 13 atualizada)

---
