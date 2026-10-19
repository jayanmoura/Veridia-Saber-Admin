-- Aplicada em 19/10/2026 pelo SQL Editor.
begin;

-- Policy órfã: o bucket imagens-das-colecoes não existe
drop policy if exists "Permitir upload para utilizadores autenticados" on storage.objects;

-- Qualquer usuário logado podia subir arquivo no bucket público imagens_conteudo.
-- O admin usa o reboot-api desde 18/10/2026; ninguém grava mais nesse bucket pelo Supabase.
drop policy if exists "Authenticated users can upload content images" on storage.objects;

commit;
