import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  return Array.from({ length: 6 }, () =>
    INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)]
  ).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { group_id } = await req.json()

    if (!group_id) {
      return new Response(JSON.stringify({ error: 'group_id ist erforderlich' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let code = generateCode()
    let attempts = 0

    while (attempts < 10) {
      // Check uniqueness
      const { data: existing } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', code)
        .maybeSingle()

      if (!existing) {
        // Code is unique — write it
        const { error: updateErr } = await supabase
          .from('groups')
          .update({ invite_code: code })
          .eq('id', group_id)

        if (!updateErr) {
          return new Response(JSON.stringify({ invite_code: code }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      code = generateCode()
      attempts++
    }

    return new Response(
      JSON.stringify({ error: 'Konnte keinen eindeutigen Einladungs-Code generieren' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
