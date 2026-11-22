import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      },
    )

    const body = await req.json()
    const email = body?.email
    const password = body?.password

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Requisição inválida.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.warn('Login failed:', { status: error.status, code: error.code })
      return new Response(
        JSON.stringify({ error: 'E-mail ou senha inválidos.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        },
      )
    }

    return new Response(
      JSON.stringify({ data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch {
    return new Response(
      JSON.stringify({ error: 'Erro interno.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
