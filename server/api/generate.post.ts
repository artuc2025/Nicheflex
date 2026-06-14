import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { assertGenerationAllowed } from '../utils/planLimits'
import { runGeneration } from '../utils/runGeneration'
import { getProfile, getSlugFromTitle } from '../utils/nicheProfiles'

export default defineEventHandler(async (event) => {
  let user: { id?: string; sub?: string } | null = null
  try {
    user = await serverSupabaseUser(event)
  } catch {
    // serverSupabaseUser throws if no session
  }
  const userId = user?.sub || user?.id
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  const { type, nicheId, targetMinutes, skeletonId } = body as {
    type?: string
    nicheId?: string
    targetMinutes?: number
    skeletonId?: string
  }

  if (type !== 'breakdown' && type !== 'skeleton' && type !== 'script') {
    throw createError({ statusCode: 400, statusMessage: 'type must be "breakdown", "skeleton", or "script"' })
  }
  if (!nicheId || typeof nicheId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'nicheId is required' })
  }

  await assertGenerationAllowed(event, userId, type)

  const supabase = createClient(
    process.env.NUXT_PUBLIC_SUPABASE_URL!,
    process.env.NUXT_SUPABASE_SECRET_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY!,
  )

  const { data: niche, error: nicheErr } = await supabase
    .from('niches')
    .select('*, niche_snapshots(*), outlier_videos(*)')
    .eq('id', nicheId)
    .single()

  if (nicheErr || !niche) {
    throw createError({ statusCode: 404, statusMessage: 'Niche not found' })
  }

  const snapshots = (niche.niche_snapshots || [])
    .sort((a: { week: string }, b: { week: string }) => b.week.localeCompare(a.week))
  const latest = snapshots[0]

  const topOutliers = (niche.outlier_videos || [])
    .sort((a: { views: number }, b: { views: number }) => b.views - a.views)
    .slice(0, 5)
    .map((v: any) => ({
      title: v.title,
      views: v.views,
      channelAgeDays: v.channel_name ? undefined : undefined,
    }))

  const slug = getSlugFromTitle(niche.title) || niche.slug
  const profile = getProfile(slug)

  let entryAngle: string | undefined
  let hookPattern: string | undefined
  let skeletonPayload: Record<string, unknown> | undefined

  if (type === 'skeleton' || type === 'script') {
    const { data: lastBreakdown } = await supabase
      .from('generations')
      .select('payload_json')
      .eq('user_id', userId)
      .eq('niche_id', nicheId)
      .eq('type', 'breakdown')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (lastBreakdown?.payload_json) {
      const p = lastBreakdown.payload_json as Record<string, unknown>
      if (typeof p.entry_angle === 'string') entryAngle = p.entry_angle
      if (Array.isArray(p.hook_patterns) && p.hook_patterns.length > 0) {
        hookPattern = p.hook_patterns[0] as string
      }
    }
  }

  if (type === 'script') {
    let skeletonQuery = supabase
      .from('generations')
      .select('payload_json')
      .eq('user_id', userId)
      .eq('niche_id', nicheId)
      .eq('type', 'skeleton')
      .order('created_at', { ascending: false })
      .limit(1)

    if (skeletonId) {
      skeletonQuery = supabase
        .from('generations')
        .select('payload_json')
        .eq('id', skeletonId)
        .single()
    }

    const { data: lastSkeleton, error: skelErr } = await skeletonQuery.single()

    if (skelErr || !lastSkeleton?.payload_json) {
      throw createError({ statusCode: 422, statusMessage: 'No skeleton found. Generate a skeleton first.' })
    }
    skeletonPayload = lastSkeleton.payload_json as Record<string, unknown>
  }

  const result = await runGeneration(
    type,
    {
      title: niche.title,
      category: niche.category || 'general',
      format: niche.format === 'long' ? 'longform' : 'shorts',
      outliers: topOutliers,
      heat: latest?.heat_score ?? 0,
      rpmRange: latest ? `$${latest.rpm_low}–$${latest.rpm_high}` : 'N/A',
      slug,
      profile,
      entryAngle,
      hookPattern,
    },
    { targetMinutes, skeleton: skeletonPayload },
  )

  await supabase.from('generations').insert({
    user_id: userId,
    niche_id: nicheId,
    type,
    payload_json: result.payload,
    provider: result.provider,
    model: result.model,
  })

  return { ok: true, payload: result.payload, type, provider: result.provider }
})
