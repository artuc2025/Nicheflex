import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL!,
  process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY!,
)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const language = query.language as string | undefined
  const format = query.format as string | undefined
  const week = query.week as string | undefined

  let nicheQuery = supabase
    .from('niches')
    .select('*, niche_snapshots(*)')
    .order('created_at', { ascending: false })

  if (language) nicheQuery = nicheQuery.eq('language', language)
  if (format) nicheQuery = nicheQuery.eq('format', format)

  const { data: niches, error } = await nicheQuery
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const results = (niches || []).map((niche) => {
    const snapshots = niche.niche_snapshots || []
    const latest = week
      ? snapshots.find((s: { week: string }) => s.week === week)
      : snapshots.sort((a: { week: string }, b: { week: string }) => b.week.localeCompare(a.week))[0]

    return {
      id: niche.id,
      slug: niche.slug,
      title: niche.title,
      language: niche.language,
      format: niche.format,
      category: niche.category,
      heat_score: latest?.heat_score || 0,
      rpm_low: latest?.rpm_low || 0,
      rpm_high: latest?.rpm_high || 0,
      views_7d: latest?.views_7d || 0,
      views_30d: latest?.views_30d || 0,
      channels_count: latest?.channels_count || 0,
      avg_channel_age_days: latest?.avg_channel_age_days || 0,
      week: latest?.week || null,
    }
  })

  results.sort((a, b) => b.heat_score - a.heat_score)

  return results
})
