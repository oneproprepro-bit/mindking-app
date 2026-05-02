import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { parentEmail, pin } = await req.json()

    if (!parentEmail || !pin) {
      return new Response(JSON.stringify({ error: 'Email ou PIN manquant' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Use the Service Role Key to bypass RLS and read public.users / public.children
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verify parent email and PIN
    const { data: users, error: userError } = await supabaseClient
      .from('users')
      .select('id, family_pin')
      .eq('email', parentEmail)

    if (userError || !users || users.length === 0) {
      return new Response(JSON.stringify({ error: 'Compte parent introuvable' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    const user = users[0]

    if (user.family_pin !== pin) {
      return new Response(JSON.stringify({ error: 'Code PIN incorrect' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // 2. PIN is correct, fetch children for this user
    const { data: children, error: childrenError } = await supabaseClient
      .from('children')
      .select('*')
      .eq('user_id', user.id)

    if (childrenError) {
      throw childrenError
    }

    // 3. Return success with children list
    // We return a simulated user object and the children array
    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, email: parentEmail, isPinChild: true },
        children: children || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
