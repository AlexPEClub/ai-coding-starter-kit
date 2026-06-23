import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy'
const CACHE_TTL_MS = 30 * 60 * 1000

interface BusyRange {
  start: string
  end: string
}

interface MemberResult {
  user_id: string
  display_name: string
  calendar_type: 'google' | 'manual' | null
  busy_ranges: BusyRange[]
}

async function refreshGoogleToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const resp = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    if (!resp.ok) return null
    const json = await resp.json()
    if (!json.access_token) return null
    return { access_token: json.access_token, expires_in: json.expires_in ?? 3600 }
  } catch {
    return null
  }
}

async function fetchGoogleFreeBusy(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<BusyRange[] | null> {
  try {
    const resp = await fetch(GOOGLE_FREEBUSY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: 'primary' }],
      }),
    })
    if (!resp.ok) return null
    const json = await resp.json()
    return (json.calendars?.primary?.busy as BusyRange[]) ?? []
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { group_id, date_from, date_to } = await req.json()

    if (!group_id || !date_from || !date_to) {
      return new Response(
        JSON.stringify({ error: 'group_id, date_from und date_to sind erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? ''

    const serviceClient = createClient(supabaseUrl, serviceKey)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Verify caller identity
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Security: caller must be a group member
    const { data: membership } = await serviceClient
      .from('group_members')
      .select('user_id')
      .eq('group_id', group_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check cache
    const { data: cached } = await serviceClient
      .from('group_availability_cache')
      .select('cached_at, data')
      .eq('group_id', group_id)
      .maybeSingle()

    if (cached) {
      const age = Date.now() - new Date(cached.cached_at).getTime()
      if (age < CACHE_TTL_MS) {
        return new Response(
          JSON.stringify({ ...(cached.data as object), cached_at: cached.cached_at }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Load all group members
    const { data: members, error: membersErr } = await serviceClient
      .from('group_members')
      .select('user_id')
      .eq('group_id', group_id)

    if (membersErr || !members) {
      return new Response(JSON.stringify({ error: 'Fehler beim Laden der Mitglieder' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userIds = members.map((m) => m.user_id)

    // Parallel: profiles + calendar connections + manual date blocks
    const [profilesRes, connectionsRes, dateBlocksRes] = await Promise.all([
      serviceClient.from('profiles').select('id, display_name').in('id', userIds),
      serviceClient
        .from('calendar_connections')
        .select('user_id, access_token, refresh_token, expires_at')
        .in('user_id', userIds),
      serviceClient
        .from('user_date_blocks')
        .select('user_id, start_date, end_date')
        .in('user_id', userIds),
    ])

    const profileMap = new Map(
      (profilesRes.data ?? []).map((p) => [p.id, p.display_name as string])
    )
    const connMap = new Map(
      (connectionsRes.data ?? []).map((c) => [c.user_id, c])
    )

    // Build manual block ranges per user (convert DATE → ISO datetime range)
    const blockMap = new Map<string, BusyRange[]>()
    for (const block of dateBlocksRes.data ?? []) {
      if (!blockMap.has(block.user_id)) blockMap.set(block.user_id, [])
      const endDate = block.end_date ?? block.start_date
      blockMap.get(block.user_id)!.push({
        start: block.start_date + 'T00:00:00Z',
        end: endDate + 'T23:59:59Z',
      })
    }

    const timeMin = date_from + 'T00:00:00Z'
    const timeMax = date_to + 'T23:59:59Z'

    // Fetch availability for each member in parallel
    const memberResults: MemberResult[] = await Promise.all(
      userIds.map(async (userId) => {
        const displayName = profileMap.get(userId) ?? 'Unbekannt'
        const conn = connMap.get(userId)
        const manualBlocks = blockMap.get(userId) ?? []

        if (!conn) {
          return {
            user_id: userId,
            display_name: displayName,
            calendar_type: manualBlocks.length > 0 ? ('manual' as const) : null,
            busy_ranges: manualBlocks,
          }
        }

        // Refresh token proactively if expired (60s buffer)
        let accessToken = conn.access_token
        const expiresAt = new Date(conn.expires_at).getTime()

        if (Date.now() >= expiresAt - 60_000) {
          const refreshed = await refreshGoogleToken(
            conn.refresh_token,
            googleClientId,
            googleClientSecret
          )
          if (!refreshed) {
            // Refresh failed — treat as grey
            return {
              user_id: userId,
              display_name: displayName,
              calendar_type: null,
              busy_ranges: manualBlocks,
            }
          }
          accessToken = refreshed.access_token
          await serviceClient
            .from('calendar_connections')
            .update({
              access_token: refreshed.access_token,
              expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
            })
            .eq('user_id', userId)
        }

        // Fetch Google freeBusy
        let googleBusy = await fetchGoogleFreeBusy(accessToken, timeMin, timeMax)

        if (googleBusy === null) {
          // Try one refresh on 401-style failure
          const refreshed = await refreshGoogleToken(
            conn.refresh_token,
            googleClientId,
            googleClientSecret
          )
          if (refreshed) {
            await serviceClient
              .from('calendar_connections')
              .update({
                access_token: refreshed.access_token,
                expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
              })
              .eq('user_id', userId)
            googleBusy = await fetchGoogleFreeBusy(refreshed.access_token, timeMin, timeMax)
          }
          if (googleBusy === null) {
            // Still failing — treat as grey
            return {
              user_id: userId,
              display_name: displayName,
              calendar_type: null,
              busy_ranges: manualBlocks,
            }
          }
        }

        return {
          user_id: userId,
          display_name: displayName,
          calendar_type: 'google' as const,
          busy_ranges: [...googleBusy, ...manualBlocks],
        }
      })
    )

    const result = { members: memberResults }
    const cachedAt = new Date().toISOString()

    // Write to cache (upsert by group_id)
    await serviceClient
      .from('group_availability_cache')
      .upsert({ group_id, cached_at: cachedAt, data: result }, { onConflict: 'group_id' })

    return new Response(
      JSON.stringify({ ...result, cached_at: cachedAt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
