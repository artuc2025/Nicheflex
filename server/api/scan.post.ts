import { createClient } from '@supabase/supabase-js'
import {
  searchVideos,
  getVideoDetails,
  getChannelDetails,
  computeOutlier,
  computeHeat,
  qualifies,
  nicheHeatScore,
  rpmForCategory,
  isoDurationToSeconds,
  getWeekString,
  type YouTubeVideoItem,
  type YouTubeChannelItem,
  type NicheFilterParams,
} from '../utils/youtube'

interface NicheConfig {
  slug: string
  title: string
  category: string
  queries: string[]
  filters: NicheFilterParams
}

const NICHES: NicheConfig[] = [
  {
    slug: 'finance', title: 'Finance & Investing', category: 'finance',
    queries: ['personal finance tips', 'investing for beginners', 'money habits rich', 'passive income ideas'],
    filters: { minRatio: 2, maxSubscribers: 1000000, minDurationSec: 120, maxDurationSec: 1200, minViews: 30000 },
  },
  {
    slug: 'ai-tools', title: 'AI News & Tools', category: 'ai-tools',
    queries: ['ChatGPT tips tricks', 'AI tool tutorial', 'best AI apps 2026', 'AI productivity workflow'],
    filters: { minRatio: 2, maxSubscribers: 500000, minDurationSec: 60, maxDurationSec: 900, minViews: 20000 },
  },
  {
    slug: 'true-crime', title: 'True Crime', category: 'true-crime',
    queries: ['unsolved case', 'true crime story', 'cold case mystery', 'serial killer documentary'],
    filters: { minRatio: 1.5, maxSubscribers: 2000000, minDurationSec: 300, maxDurationSec: 3600, minViews: 50000 },
  },
  {
    slug: 'business-stories', title: 'Business Stories', category: 'business-stories',
    queries: ['company rise and fall', 'business failure story', 'startup failed', 'corporate scandal'],
    filters: { minRatio: 2, maxSubscribers: 500000, minDurationSec: 300, maxDurationSec: 1800, minViews: 20000 },
  },
  {
    slug: 'history', title: 'History Documentary', category: 'history',
    queries: ['ancient mystery', 'forgotten history', 'history fact surprising', 'historical event explained'],
    filters: { minRatio: 1.5, maxSubscribers: 2000000, minDurationSec: 300, maxDurationSec: 3600, minViews: 50000 },
  },
  {
    slug: 'family-drama', title: 'Family Drama / Karma', category: 'family-drama',
    queries: ['karma story real', 'family betrayal story', 'revenge story', 'family drama confession'],
    filters: { minRatio: 2, maxSubscribers: 500000, minDurationSec: 120, maxDurationSec: 3600, minViews: 15000 },
  },
  {
    slug: 'space-science', title: 'Space & Science', category: 'space-science',
    queries: ['space discovery recent', 'NASA finding', 'solar system mystery', 'universe explained'],
    filters: { minRatio: 1.5, maxSubscribers: 2000000, minDurationSec: 300, maxDurationSec: 3600, minViews: 50000 },
  },
  {
    slug: 'horror-stories', title: 'Horror Narration', category: 'horror-stories',
    queries: ['animated horror story', 'creepypasta narrated', 'scary story animation', 'reddit horror story narrated'],
    filters: { minRatio: 2, maxSubscribers: 500000, minDurationSec: 120, maxDurationSec: 1800, minViews: 15000 },
  },
]

const COOLDOWN_HOURS = 8
const DAILY_UNITS_CAP = 9000

function createSupabase() {
  return createClient(
    process.env.NUXT_PUBLIC_SUPABASE_URL!,
    process.env.NUXT_SUPABASE_SECRET_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY!,
  )
}

export default defineEventHandler(async (event) => {
  const supabase = createSupabase()
  const config = useRuntimeConfig()

  let userId: string | null = null
  const authHeader = event.headers?.get?.('authorization')
    || (event.node?.req?.headers?.authorization as string | undefined)

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user) userId = user.id
  }

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id || null
  }

  const adminUserId = config.adminUserId || config.public.adminUserId
  if (!adminUserId || userId !== adminUserId) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const { data: latestSnap } = await supabase
    .from('niche_snapshots')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestSnap) {
    const lastScan = new Date(latestSnap.created_at)
    const hoursSince = (Date.now() - lastScan.getTime()) / (1000 * 60 * 60)
    if (hoursSince < COOLDOWN_HOURS) {
      const remaining = Math.ceil(COOLDOWN_HOURS - hoursSince)
      throw createError({
        statusCode: 429,
        statusMessage: `Scan cooldown active. Try again in ${remaining}h.`,
      })
    }
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { data: todaySnaps } = await supabase
    .from('niche_snapshots')
    .select('id')
    .gte('created_at', todayStart.toISOString())

  const scansToday = todaySnaps ? Math.ceil(todaySnaps.length / 8) : 0
  const estimatedUnitsToday = scansToday * 3216
  if (estimatedUnitsToday + 3216 > DAILY_UNITS_CAP) {
    throw createError({
      statusCode: 429,
      statusMessage: `Daily YouTube quota cap (9000 units) would be exceeded. ~${estimatedUnitsToday} used today. Try again tomorrow.`,
    })
  }

  const apiKey = process.env.NUXT_YOUTUBE_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'YouTube API key not configured' })
  }

  const week = getWeekString()
  const results: Record<string, unknown>[] = []
  let totalUnitsEstimate = 0

  for (const niche of NICHES) {
    try {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      const isoDate = ninetyDaysAgo.toISOString()

      const allSearchResults: Map<string, { videoId: string; snippet: any }> = new Map()
      for (const query of niche.queries) {
        const searchResults = await searchVideos(apiKey, {
          q: query,
          publishedAfter: isoDate,
          maxResults: 20,
          order: 'viewCount',
          videoDuration: 'long',
        })
        totalUnitsEstimate += 100
        for (const r of searchResults) {
          if (!allSearchResults.has(r.id.videoId)) {
            allSearchResults.set(r.id.videoId, r)
          }
        }
      }

      const searchItems = Array.from(allSearchResults.values())

      if (!searchItems.length) {
        await upsertNicheWithSnapshot(supabase, niche, week, 0, 0, 0)
        results.push({ niche: niche.slug, status: 'no_results', outliers: 0, heat_score: 0 })
        continue
      }

      const videoIds = searchItems.map((r) => r.id.videoId)
      const videos = await getVideoDetails(apiKey, videoIds)
      totalUnitsEstimate += 1

      const channelIds = [...new Set(videos.map((v) => v.snippet.channelId))]
      const channels = await getChannelDetails(apiKey, channelIds)
      totalUnitsEstimate += 1

      const channelMap = new Map<string, YouTubeChannelItem>(channels.map((c) => [c.id, c]))

      const qualifying: Array<{
        video: YouTubeVideoItem
        outlier: { views: number; subs: number; ratio: number; heat: number }
        heat: number
      }> = []

      const rejectionReasons: Record<string, number> = {}

      for (const video of videos) {
        const channel = channelMap.get(video.snippet.channelId)
        if (!channel) continue

        const outlier = computeOutlier(video, channel)
        const durationSec = isoDurationToSeconds(video.contentDetails.duration)
        const ageDays = (Date.now() - new Date(video.snippet.publishedAt).getTime()) / (1000 * 60 * 60 * 24)

        const heat = computeHeat({ views: outlier.views, subs: outlier.subs, ratio: outlier.ratio, ageDays, daysBack: 90 })
        const outlierWithHeat = { ...outlier, heat }

        const doesQualify = qualifies(outlierWithHeat, durationSec, video.snippet.title, niche.filters, video)

        if (doesQualify) {
          qualifying.push({ video, outlier: outlierWithHeat, heat })
        } else {
          let reason = 'other'
          if (outlier.ratio < niche.filters.minRatio) reason = 'ratio'
          else if (outlier.views < niche.filters.minViews) reason = 'views'
          else if (outlier.subs > niche.filters.maxSubscribers) reason = 'subs'
          else if (durationSec < niche.filters.minDurationSec) reason = 'too_short'
          else if (durationSec > niche.filters.maxDurationSec) reason = 'too_long'
          rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1
        }
      }

      const heatScore = nicheHeatScore(qualifying.map((q) => q.heat))
      const [rpmLow, rpmHigh] = rpmForCategory(niche.category)

      const { data: nicheRow, error: nicheErr } = await supabase
        .from('niches')
        .upsert(
          { slug: niche.slug, title: niche.title, language: 'en', format: 'long', category: niche.category },
          { onConflict: 'slug' },
        )
        .select('id')
        .single()

      if (nicheErr) throw nicheErr

      const { error: snapErr } = await supabase.from('niche_snapshots').upsert(
        {
          niche_id: nicheRow.id,
          week,
          heat_score: Math.round(heatScore * 100) / 100,
          rpm_low: rpmLow,
          rpm_high: rpmHigh,
          views_7d: 0,
          views_30d: 0,
          channels_count: new Set(videos.map((v) => v.snippet.channelId)).size,
          avg_channel_age_days: 0,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'niche_id,week' },
      )

      if (snapErr) throw snapErr

      await supabase.from('outlier_videos').delete().match({ niche_id: nicheRow.id, snapshot_week: week })

      if (qualifying.length > 0) {
        const topOutliers = qualifying
          .sort((a, b) => b.heat - a.heat)
          .slice(0, 10)
          .map((q) => ({
            niche_id: nicheRow.id,
            yt_video_id: q.video.id,
            title: q.video.snippet.title,
            views: q.outlier.views,
            vph: 0,
            channel_id: q.video.snippet.channelId,
            channel_name: q.video.snippet.channelTitle,
            published_at: q.video.snippet.publishedAt,
            snapshot_week: week,
            ratio: Math.round(q.outlier.ratio * 100) / 100,
            heat: Math.round(q.heat * 1000) / 1000,
          }))

        await supabase.from('outlier_videos').insert(topOutliers)
      }

      results.push({
        niche: niche.slug,
        heat_score: Math.round(heatScore * 100) / 100,
        outliers: qualifying.length,
        total_scanned: videos.length,
        queries: niche.queries.length,
        rpm: `$${rpmLow}–$${rpmHigh}`,
        top_video: qualifying[0]?.video.snippet.title || 'N/A',
        rejections: rejectionReasons,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ niche: niche.slug, error: message })
    }
  }

  const totalQueries = NICHES.reduce((sum, n) => sum + n.queries.length, 0)

  return {
    week,
    scanned: results.length,
    total_queries: totalQueries,
    api_units_estimate: totalUnitsEstimate,
    results,
  }
})

async function upsertNicheWithSnapshot(
  supabase: ReturnType<typeof createSupabase>,
  niche: { slug: string; title: string; category: string },
  week: string,
  heatScore: number,
  rpmLow: number,
  rpmHigh: number,
) {
  const { data: nicheRow, error: nicheErr } = await supabase
    .from('niches')
    .upsert(
      { slug: niche.slug, title: niche.title, language: 'en', format: 'long', category: niche.category },
      { onConflict: 'slug' },
    )
    .select('id')
    .single()

  if (nicheErr) throw nicheErr

  await supabase.from('niche_snapshots').upsert(
    {
      niche_id: nicheRow.id,
      week,
      heat_score: heatScore,
      rpm_low: rpmLow,
      rpm_high: rpmHigh,
      views_7d: 0,
      views_30d: 0,
      channels_count: 0,
      avg_channel_age_days: 0,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'niche_id,week' },
  )
}
