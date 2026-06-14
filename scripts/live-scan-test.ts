import 'dotenv/config'
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
} from '../server/utils/youtube.js'

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

const supabase = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL!,
  process.env.NUXT_SUPABASE_SECRET_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY!,
)

const apiKey = process.env.NUXT_YOUTUBE_API_KEY!
const week = getWeekString()
const results: Record<string, unknown>[] = []
let totalUnitsEstimate = 0

console.log(`\n=== LIVE SCAN — Week ${week} ===`)
console.log(`Niches: ${NICHES.length} | Total queries: ${NICHES.reduce((s, n) => s + n.queries.length, 0)}\n`)

for (const niche of NICHES) {
  try {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const isoDate = ninetyDaysAgo.toISOString()

    const allSearchResults: Map<string, any> = new Map()
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
    console.log(`[${niche.slug}] ${niche.queries.length} queries → ${searchItems.length} unique videos`)

    if (!searchItems.length) {
      console.log(`  → 0 results`)
      results.push({ niche: niche.slug, outliers: 0, heat_score: 0 })
      continue
    }

    const videoIds = searchItems.map((r: any) => r.id.videoId)
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

    const rejectedRegional: Array<{ title: string; reason: string }> = []
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

        const lang = video.defaultAudioLanguage || video.defaultLanguage
        const isRegional = reason === 'other' || (lang && !lang.startsWith('en'))
        if (isRegional) {
          rejectedRegional.push({ title: video.snippet.title.substring(0, 60), reason: reason === 'other' ? 'non-latin/keyword' : `lang=${lang}` })
        }
      }
    }

    const heatScore = nicheHeatScore(qualifying.map((q) => q.heat))
    const [rpmLow, rpmHigh] = rpmForCategory(niche.category)

    // DB writes
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

      const { error: insertErr } = await supabase.from('outlier_videos').insert(topOutliers)
      if (insertErr) throw insertErr
    }

    console.log(`  → ${qualifying.length} QUALIFYING out of ${videos.length} | heat=${(Math.round(heatScore * 100) / 100).toFixed(2)} | rpm=$${rpmLow}–$${rpmHigh}`)
    if (Object.keys(rejectionReasons).length > 0) {
      console.log(`  → Rejections: ${Object.entries(rejectionReasons).map(([k, v]) => `${k}=${v}`).join(', ')}`)
    }
    if (rejectedRegional.length > 0) {
      console.log(`  → Regional/non-English removed (${rejectedRegional.length}):`)
      for (const r of rejectedRegional.slice(0, 5)) {
        console.log(`    ✗ "${r.title}" [${r.reason}]`)
      }
    }
    if (qualifying.length > 0) {
      const sorted = qualifying.sort((a, b) => b.heat - a.heat)
      for (const q of sorted.slice(0, 3)) {
        console.log(`  ★ "${q.video.snippet.title.substring(0, 60)}" views=${q.outlier.views} subs=${q.outlier.subs} ratio=${q.outlier.ratio.toFixed(2)} heat=${q.heat.toFixed(3)}`)
      }
    }

    results.push({
      niche: niche.slug,
      heat_score: Math.round(heatScore * 100) / 100,
      outliers: qualifying.length,
      total_scanned: videos.length,
      rpm: `$${rpmLow}–$${rpmHigh}`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.log(`  → ERROR: ${message}`)
    results.push({ niche: niche.slug, error: message })
  }
}

console.log(`\n=== SUMMARY ===`)
const outliers = results.filter((r: any) => r.outliers > 0)
const empty = results.filter((r: any) => r.outliers === 0 && !r.error)
const errored = results.filter((r: any) => r.error)
console.log(`Niches WITH outliers: ${outliers.length} — ${outliers.map((r: any) => r.niche).join(', ')}`)
console.log(`Niches EMPTY (0): ${empty.length} — ${empty.map((r: any) => r.niche).join(', ')}`)
if (errored.length) console.log(`Niches ERRORED: ${errored.map((r: any) => r.niche).join(', ')}`)

const heatScores = results.filter((r: any) => r.heat_score !== undefined).map((r: any) => r.heat_score as number)
console.log(`Heat range: ${Math.min(...heatScores).toFixed(2)} – ${Math.max(...heatScores).toFixed(2)}`)
console.log(`API units consumed: ${totalUnitsEstimate}`)
console.log(`Queries total: ${NICHES.reduce((s, n) => s + n.queries.length, 0)}`)

// DB verification
console.log(`\n=== DB VERIFICATION ===`)
const { data: dbRows } = await supabase
  .from('outlier_videos')
  .select('title, views, ratio, heat, channel_name, niche_id')
  .eq('snapshot_week', week)
  .order('heat', { ascending: false })
  .limit(20)

console.log(`outlier_videos rows for ${week}: ${dbRows?.length || 0}`)
for (const row of dbRows || []) {
  console.log(`  "${row.title.substring(0, 55)}" views=${row.views} ratio=${row.ratio} heat=${row.heat} ch=${row.channel_name}`)
}

const { data: snaps } = await supabase
  .from('niche_snapshots')
  .select('heat_score, rpm_low, rpm_high, niches!inner(slug)')
  .eq('week', week)

console.log(`\nSnapshots: ${snaps?.length || 0}`)
for (const s of snaps || []) {
  console.log(`  ${(s as any).niches?.slug}: heat=${s.heat_score} rpm=$${s.rpm_low}–$${s.rpm_high}`)
}
