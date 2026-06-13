import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'
import { assertGenerationAllowed } from '../utils/planLimits'
import { nicheBreakdownPrompt, scriptSkeletonPrompt } from '../prompts/flex'
import { retryGenerate } from '../utils/retryGenerate'

export default defineEventHandler(async (event) => {
  let user: { id: string } | null = null
  try {
    user = await serverSupabaseUser(event)
  } catch {
    // serverSupabaseUser throws if no session
  }
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody(event)
  const { type, nicheId, targetMinutes } = body as {
    type?: string
    nicheId?: string
    targetMinutes?: number
  }

  if (type !== 'breakdown' && type !== 'skeleton') {
    throw createError({ statusCode: 400, statusMessage: 'type must be "breakdown" or "skeleton"' })
  }
  if (!nicheId || typeof nicheId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'nicheId is required' })
  }

  await assertGenerationAllowed(event, user.id, type)

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

  const fmt = (niche.format === 'long' ? 'longform' : 'shorts') as 'longform' | 'shorts'

  let aiReq

  if (type === 'breakdown') {
    const prompt = nicheBreakdownPrompt({
      title: niche.title,
      category: niche.category || 'general',
      format: fmt,
      outliers: topOutliers,
      heat: latest?.heat_score ?? 0,
      rpmRange: latest ? `$${latest.rpm_low}–$${latest.rpm_high}` : 'N/A',
    })
    aiReq = { system: prompt.system, user: prompt.user, json: true as const }
  } else {
    const prompt = scriptSkeletonPrompt({
      nicheTitle: niche.title,
      format: fmt,
      targetMinutes: targetMinutes ?? 12,
    })
    aiReq = { system: prompt.system, user: prompt.user, json: true as const }
  }

  const result = await retryGenerate(aiReq, { type, maxAttempts: 3 })

  await supabase.from('generations').insert({
    user_id: user.id,
    niche_id: nicheId,
    type,
    payload_json: result.parsed,
    provider: result.provider,
    model: result.model,
  })

  return { ok: true, payload: result.parsed, type, provider: result.provider }
})
