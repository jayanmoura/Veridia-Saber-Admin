import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            // Supabase API URL - Env var automatically injected
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase Anon Key - Env var automatically injected
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                auth: {
                    persistSession: false // Function doesn't need to persist session
                }
            }
        )

        const { email, password } = await req.json()

        // 1. Tenta fazer login no servidor
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        })

        // 2. Se der erro (ex: senha errada), NÅO retorna 400.
        // Retorna 200 OK, mas com um campo "error" no JSON.
        // Isso engana o navegador e evita a linha vermelha no console.
        if (error) {
            console.log("Login error (safe handled):", error.message)
            return new Response(
                JSON.stringify({ error: error.message }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200, // <--- O PULO DO GATO: Status 200 mascarando o erro
                },
            )
        }

        // 3. Se der sucesso, retorna os dados da sessão
        return new Response(
            JSON.stringify({ data }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch {
        // Erros inesperados tb retornam 200 com msg generica para segurança total
        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    }
})
