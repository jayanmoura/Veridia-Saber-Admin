---
description: Diagnóstico e correção de bugs no painel admin
---

# Workflow: Correção de Bug

## Passos

### 1. Leia o schema para entender a estrutura de dados envolvida
// turbo
```
view_file SUPABASE_SCHEMA.md
```

### 2. Localize o arquivo com o bug
// turbo
Antes de qualquer correção, leia o arquivo completo onde o bug ocorre. Nunca edite sem ler antes.

### 3. Reproduza mentalmente o fluxo
// turbo
Trace o caminho: componente → hook → query Supabase → RLS policy → resposta.
Identifique em qual camada o problema está.

---

## Checklist de Diagnóstico

Antes de propor qualquer correção, confirme:

- [ ] O erro é no frontend (TypeScript, React) ou no backend (Supabase, RLS)?
- [ ] A query está retornando erro ou retornando dados errados/vazios?
- [ ] A política RLS permite a operação para o role do usuário logado?
- [ ] O tipo TypeScript está compatível com o que o Supabase retorna?
- [ ] Se for storage: o bucket é público? A subfolder está correta?

## Regras de Correção
- Nunca fazer refatoração junto com correção de bug — uma coisa de cada vez
- Sempre mostrar o trecho anterior e o trecho corrigido lado a lado
- Se a correção envolver SQL (RLS, função), mostrar o script completo pronto para rodar no Supabase SQL Editor
- Se houver risco de regressão, indicar explicitamente o que testar após a correção