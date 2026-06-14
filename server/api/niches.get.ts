import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL!,
  process.env.NUXT_SUPABASE_SECRET_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY!,
)

export default defineEventHandler(async (event) => {
  const url = new URL(event.node?.req?.url || '/', `http://${event.node?.req?.headers?.host || 'localhost'}`)
  const language = url.searchParams.get('language') || undefined
  const format = url.searchParams.get('format') || undefined
  const week = url.searchParams.get('week') || undefined

  let nicheQuery = supabase
    .from('niches')
    .select('*, niche_snapshots(*)')
    .order('created_at', { ascending: false })

  if (language) nicheQuery = nicheQuery.eq('language', language)
  if (format) nicheQuery = nicheQuery.eq('format', format)

  const { data: niches, error } = await nicheQuery
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const results = (niches || [])
    .map((niche) => {
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
    .filter((n) => n.heat_score > 0)

  results.sort((a, b) => b.heat_score - a.heat_score)

  return results
})
