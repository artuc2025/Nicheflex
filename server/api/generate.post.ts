import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL!,
  process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY!,
)

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { niche_id, type } = body as { niche_id: string; type: 'breakdown' | 'skeleton' }

  if (!niche_id || !type) {
    throw createError({ statusCode: 400, statusMessage: 'niche_id and type required' })
  }

  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, generations_used')
    .eq('id', user.id)
    .single()

  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  if (profile.plan === 'free') {
    if (type === 'breakdown' && profile.generations_used >= 1) {
      throw createError({ statusCode: 403, statusMessage: 'Free plan: 1 breakdown/month. Upgrade to Pro.' })
    }
    if (type === 'skeleton') {
      throw createError({ statusCode: 403, statusMessage: 'Free plan: no script skeletons. Upgrade to Pro.' })
    }
  }

  const { data: niche } = await supabase
    .from('niches')
    .select('*, niche_snapshots(*), outlier_videos(*)')
    .eq('id', niche_id)
    .single()

  if (!niche) throw createError({ statusCode: 404, statusMessage: 'Niche not found' })

  const snapshots = niche.niche_snapshots || []
  const latest = snapshots.sort((a: { week: string }, b: { week: string }) =>
    b.week.localeCompare(a.week),
  )[0]

  const topVideos = (niche.outlier_videos || [])
    .sort((a: { views: number }, b: { views: number }) => b.views - a.views)
    .slice(0, 5)
    .map((v: { title: string; views: number; channel_name: string; vph: number }) => ({
      title: v.title,
      views: v.views,
      channel_name: v.channel_name,
      vph: v.vph,
    }))

  let aiEndpoint = ''
  let payload: Record<string, unknown> = {}

  if (type === 'breakdown') {
    aiEndpoint = `${AI_SERVICE_URL}/breakdown`
    payload = {
      niche_title: niche.title,
      top_videos: topVideos,
      metrics: {
        heat_score: latest?.heat_score || 0,
        rpm_low: latest?.rpm_low || 0,
        rpm_high: latest?.rpm_high || 0,
        views_7d: latest?.views_7d || 0,
        views_30d: latest?.views_30d || 0,
        channels_count: latest?.channels_count || 0,
      },
    }
  } else {
    aiEndpoint = `${AI_SERVICE_URL}/skeleton`
    payload = {
      niche_title: niche.title,
      niche_analysis: 'Faceless YouTube niche — use FLEX ENGINE mechanics.',
      video_format: niche.format || 'long',
    }
  }

  const aiRes = await fetch(aiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!aiRes.ok) {
    const err = await aiRes.text()
    throw createError({ statusCode: 502, statusMessage: `AI service error: ${err}` })
  }

  const result = await aiRes.json()

  await supabase.from('generations').insert({
    user_id: user.id,
    niche_id,
    type,
    payload_json: result,
  })

  await supabase
    .from('user_profiles')
    .update({ generations_used: profile.generations_used + 1, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  return result
})
