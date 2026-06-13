import { createClient } from '@supabase/supabase-js'
import {
  searchVideos,
  getVideoDetails,
  getChannelDetails,
  calcVPH,
  calcHeatScore,
  getWeekString,
} from '../utils/youtube'

const NICHES = [
  { slug: 'finance', title: 'Finance & Investing', query: 'finance investing money', category: 'finance' },
  { slug: 'ai-tools', title: 'AI News & Tools', query: 'artificial intelligence tools news', category: 'ai' },
  { slug: 'true-crime', title: 'True Crime', query: 'true crime documentary', category: 'true-crime' },
  { slug: 'business-stories', title: 'Business Stories', query: 'business story company rise fall', category: 'business' },
  { slug: 'history', title: 'History Documentary', query: 'history documentary', category: 'history' },
  { slug: 'family-drama', title: 'Family Drama / Karma', query: 'family drama revenge karma story', category: 'drama' },
  { slug: 'space-science', title: 'Space & Science', query: 'space science discovery', category: 'science' },
  { slug: 'horror-stories', title: 'Horror Narration', query: 'horror scary story narration', category: 'horror' },
]

const supabase = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL!,
  process.env.NUXT_SUPABASE_SECRET_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY!,
)

export default defineEventHandler(async (event) => {
  const apiKey = process.env.NUXT_YOUTUBE_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'YouTube API key not configured' })
  }

  const week = getWeekString()
  const results: Record<string, unknown>[] = []

  for (const niche of NICHES) {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const isoDate = thirtyDaysAgo.toISOString()

      const searchResults = await searchVideos(apiKey, {
        q: niche.query,
        publishedAfter: isoDate,
        maxResults: 20,
        order: 'viewCount',
        videoDuration: 'long',
      })

      if (!searchResults.length) {
        results.push({ niche: niche.slug, status: 'no_results' })
        continue
      }

      const videoIds = searchResults.map((r) => r.id.videoId)
      const videos = await getVideoDetails(apiKey, videoIds)

      const channelIds = [...new Set(videos.map((v) => v.snippet.channelId))]
      const channels = await getChannelDetails(apiKey, channelIds)
      const channelMap = new Map(channels.map((c) => [c.id, c]))

      let totalViews7d = 0
      let totalViews30d = 0
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      for (const video of videos) {
        const views = parseInt(video.statistics.viewCount || '0')
        const pubDate = new Date(video.snippet.publishedAt)
        if (pubDate > weekAgo) totalViews7d += views
        totalViews30d += views
      }

      const avgRpmLow = 3
      const avgRpmHigh = 12
      const uniqueChannels = new Set(videos.map((v) => v.snippet.channelId))
      const avgChannelAge = channels.length
        ? Math.round(
            channels.reduce((acc, ch) => {
              const age = (Date.now() - new Date(ch.snippet.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
              return acc + age
            }, 0) / channels.length,
          )
        : 0

      const heatScore = calcHeatScore({
        viewsGrowth7d: totalViews7d,
        viewsGrowth30d: totalViews30d,
        rpmHigh: avgRpmHigh,
        channelsCount: uniqueChannels.size,
      })

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
          heat_score: heatScore,
          rpm_low: avgRpmLow,
          rpm_high: avgRpmHigh,
          views_7d: totalViews7d,
          views_30d: totalViews30d,
          channels_count: uniqueChannels.size,
          avg_channel_age_days: avgChannelAge,
        },
        { onConflict: 'niche_id,week' },
      )

      if (snapErr) throw snapErr

      const topVideos = videos.slice(0, 5).map((v) => ({
        niche_id: nicheRow.id,
        yt_video_id: v.id,
        title: v.snippet.title,
        views: parseInt(v.statistics.viewCount || '0'),
        vph: calcVPH(parseInt(v.statistics.viewCount || '0'), v.snippet.publishedAt),
        channel_id: v.snippet.channelId,
        channel_name: v.snippet.channelTitle,
        published_at: v.snippet.publishedAt,
        snapshot_week: week,
      }))

      await supabase.from('outlier_videos').delete().match({ niche_id: nicheRow.id, snapshot_week: week })
      await supabase.from('outlier_videos').insert(topVideos)

      results.push({
        niche: niche.slug,
        heat_score: heatScore,
        views_7d: totalViews7d,
        views_30d: totalViews30d,
        channels: uniqueChannels.size,
        top_video: topVideos[0]?.title || 'N/A',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ niche: niche.slug, error: message })
    }
  }

  return { week, scanned: results.length, results }
})
