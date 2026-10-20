-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Tabela admin_notifications: remanescente de uma tentativa de painel admin dentro
-- do app mobile que não vingou (confirmado pelo usuário). 0 linhas em produção.
-- Só existia um consumidor (NotificationContext.tsx no app, lendo/assinando realtime),
-- sem nenhuma tela em nenhum dos três repositórios que efetivamente insira uma notificação,
-- e sem nenhum componente de UI no app que exiba o unreadCount. Sendo removida junto com
-- o código do app que a referenciava.
DROP TABLE IF EXISTS public.admin_notifications;
