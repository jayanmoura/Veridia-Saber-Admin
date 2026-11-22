// Edge Function: cleanup-user-storage
// Remove as fotos de coleções (bucket fotos-das-colecoes) de uma conta excluída.
// Chamada apenas pelo trigger trg_auth_users_enqueue_storage_cleanup (auth.users, AFTER DELETE),
// que envia só o job_id da fila private.storage_cleanup_jobs.
// Autenticação: cabeçalho x-webhook-secret, conferido no banco contra o Vault (verify_jwt = false).
// Deploy: supabase functions deploy cleanup-user-storage --no-verify-jwt
// Migration de origem: supabase/migrations/20261122120000_cleanup_storage_webhook_seguro.sql

import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const BUCKET = 'fotos-das-colecoes'
const LOTE = 100

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function log(nivel: 'log' | 'warn' | 'error', dados: Record<string, unknown>): void {
  console[nivel](JSON.stringify(dados))
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' })
  }

  // 1. Sem segredo no formato esperado: recusa antes de qualquer acesso ao banco ou ao Storage.
  const secret = req.headers.get('x-webhook-secret') ?? ''
  if (!/^[0-9a-f]{64}$/.test(secret)) {
    return json(401, { error: 'unauthorized' })
  }

  let jobId: number
  try {
    const body = await req.json()
    jobId = Number(body?.job_id)
  } catch {
    return json(400, { error: 'invalid_body' })
  }
  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    return json(400, { error: 'invalid_job' })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  // 2. O banco confere o segredo e o job, e devolve a conta a limpar (fonte confiável).
  const { data: userId, error: claimError } = await supabase.rpc('storage_cleanup_claim', {
    p_job_id: jobId,
    p_secret: secret,
  })
  if (claimError || typeof userId !== 'string') {
    const status = claimError?.code === '28000' ? 401 : 404
    log('warn', { job_id: jobId, resultado: 'recusado', status })
    return json(status, { error: status === 401 ? 'unauthorized' : 'job_not_found' })
  }

  const finalizar = async (ok: boolean, removidos: number, erro: string | null): Promise<void> => {
    const { error } = await supabase.rpc('storage_cleanup_finish', {
      p_job_id: jobId,
      p_ok: ok,
      p_removidos: removidos,
      p_erro: erro,
    })
    if (error) log('error', { job_id: jobId, resultado: 'erro_ao_finalizar' })
  }

  // 3. A conta precisa ter sido excluída de fato.
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
  if (userData?.user) {
    await finalizar(false, 0, 'conta ainda existe')
    log('warn', { job_id: jobId, resultado: 'conta_ainda_existe' })
    return json(409, { error: 'user_still_exists' })
  }
  if (userError && userError.status !== 404) {
    await finalizar(false, 0, 'falha ao confirmar exclusao da conta')
    log('error', { job_id: jobId, resultado: 'falha_confirmacao' })
    return json(500, { error: 'confirmation_failed' })
  }

  // 4. Lista completa dos objetos da conta, direto de storage.objects (sem paginação).
  const { data: nomes, error: listError } = await supabase.rpc('storage_cleanup_list_objects', {
    p_job_id: jobId,
  })
  if (listError || !Array.isArray(nomes)) {
    await finalizar(false, 0, 'falha ao listar objetos')
    log('error', { job_id: jobId, resultado: 'falha_listagem' })
    return json(500, { error: 'list_failed' })
  }

  // 5. Remoção em lotes; sucesso só se tudo foi removido.
  let removidos = 0
  let falhas = 0
  for (let i = 0; i < nomes.length; i += LOTE) {
    const lote = (nomes as string[]).slice(i, i + LOTE)
    const { data, error } = await supabase.storage.from(BUCKET).remove(lote)
    const n = error ? 0 : (data?.length ?? 0)
    removidos += n
    falhas += lote.length - n
  }

  const ok = falhas === 0
  await finalizar(ok, removidos, ok ? null : `${falhas} arquivo(s) nao removido(s)`)
  log(ok ? 'log' : 'error', { job_id: jobId, resultado: ok ? 'concluido' : 'parcial', removidos, falhas })
  return json(ok ? 200 : 500, { job_id: jobId, removidos, falhas })
})
