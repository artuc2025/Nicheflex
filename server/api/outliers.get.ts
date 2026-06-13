import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL!,
  process.env.NUXT_SUPABASE_SECRET_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY!,
)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const nicheId = query.niche_id as string
  const week = query.week as string

  if (!nicheId) throw createError({ statusCode: 400, statusMessage: 'niche_id required' })

  let videoQuery = supabase
    .from('outlier_videos')
    .select('*')
    .eq('niche_id', nicheId)
    .order('views', { ascending: false })
    .limit(5)

  if (week) videoQuery = videoQuery.eq('snapshot_week', week)

  const { data, error } = await videoQuery
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data || []
})
