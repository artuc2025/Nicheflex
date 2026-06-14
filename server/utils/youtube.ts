const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3'

interface SearchParams {
  q: string
  publishedAfter?: string
  publishedBefore?: string
  maxResults?: number
  order?: string
  type?: string
  videoDuration?: string
}

export interface YouTubeSearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    channelId: string
    channelTitle: string
    publishedAt: string
    description: string
  }
}

export interface YouTubeVideoItem {
  id: string
  statistics: {
    viewCount: string
    likeCount?: string
    commentCount?: string
  }
  contentDetails: {
    duration: string
  }
  snippet: {
    publishedAt: string
    title: string
    channelId: string
    channelTitle: string
  }
  defaultAudioLanguage?: string
  defaultLanguage?: string
}

export interface YouTubeChannelItem {
  id: string
  statistics: {
    subscriberCount: string
    videoCount: string
    viewCount: string
  }
  snippet: {
    publishedAt: string
    title: string
  }
}

export async function searchVideos(apiKey: string, params: SearchParams): Promise<YouTubeSearchItem[]> {
  const url = new URL(`${YOUTUBE_API}/search`)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', params.q)
  url.searchParams.set('type', params.type || 'video')
  url.searchParams.set('order', params.order || 'viewCount')
  url.searchParams.set('maxResults', String(params.maxResults || 20))
  if (params.publishedAfter) url.searchParams.set('publishedAfter', params.publishedAfter)
  if (params.publishedBefore) url.searchParams.set('publishedBefore', params.publishedBefore)
  if (params.videoDuration) url.searchParams.set('videoDuration', params.videoDuration)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`YouTube search error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.items || []
}

export async function getVideoDetails(apiKey: string, videoIds: string[]): Promise<YouTubeVideoItem[]> {
  const results: YouTubeVideoItem[] = []
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50)
    const url = new URL(`${YOUTUBE_API}/videos`)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('part', 'statistics,contentDetails,snippet,defaultAudioLanguage,defaultLanguage')
    url.searchParams.set('id', batch.join(','))

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`YouTube videos error: ${res.status} ${await res.text()}`)
    const data = await res.json()
    results.push(...(data.items || []))
  }
  return results
}

export async function getChannelDetails(apiKey: string, channelIds: string[]): Promise<YouTubeChannelItem[]> {
  const results: YouTubeChannelItem[] = []
  for (let i = 0; i < channelIds.length; i += 50) {
    const batch = channelIds.slice(i, i + 50)
    const url = new URL(`${YOUTUBE_API}/channels`)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('part', 'statistics,snippet')
    url.searchParams.set('id', batch.join(','))

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`YouTube channels error: ${res.status} ${await res.text()}`)
    const data = await res.json()
    results.push(...(data.items || []))
  }
  return results
}

export function calcVPH(views: number, publishedAt: string): number {
  const hoursSincePublished = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60)
  if (hoursSincePublished < 1) return views
  return Math.round((views / hoursSincePublished) * 100) / 100
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function isoDurationToSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0')
}

export interface OutlierData {
  views: number
  subs: number
  ratio: number
  heat: number
}

export function computeOutlier(video: YouTubeVideoItem, channel: YouTubeChannelItem): OutlierData {
  const views = parseInt(video.statistics.viewCount || '0', 10)
  const subs = parseInt(channel.statistics.subscriberCount || '0', 10)
  const channelVideos = Math.max(1, parseInt(channel.statistics.videoCount || '1', 10))
  const channelTotalViews = parseInt(channel.statistics.viewCount || '0', 10)

  const channelAvgViews = channelTotalViews / channelVideos
  const ratio = views / Math.max(1, channelAvgViews)

  return { views, subs, ratio, heat: 0 }
}

export function computeHeat(params: {
  views: number
  subs: number
  ratio: number
  ageDays: number
  daysBack?: number
}): number {
  const daysBack = params.daysBack ?? 90
  const ratioN = clamp01(Math.log10(Math.max(1, params.ratio)) / Math.log10(24))
  const recencyN = clamp01(1 - params.ageDays / daysBack)
  const replicabilityN = clamp01(1 - Math.log10(Math.max(1, params.subs)) / Math.log10(300000))
  const reachN = clamp01(Math.log10(Math.max(1, params.views)) / 6.5)

  return 0.30 * reachN + 0.30 * ratioN + 0.25 * recencyN + 0.15 * replicabilityN
}

export interface NicheFilterParams {
  minRatio: number
  maxSubscribers: number
  minDurationSec: number
  maxDurationSec: number
  minViews: number
}

const EXCLUDE_KEYWORDS = [
  'suvichar', 'hindi', 'urdu', 'kahaniya', 'kahani', 'animated story',
  'gulli bulli', 'khooni', 'bhoot', 'moral story', 'bedtime story',
  'horror cartoon', 'bangla', 'tamil', 'telugu', 'marathi', 'gujarati',
  'punjabi', 'bengali', 'odia', 'kannada', 'malayalam',
]
const excludeRegex = new RegExp(EXCLUDE_KEYWORDS.join('|'), 'i')

const NON_LATIN_THRESHOLD = 0.15

function hasNonLatinScript(title: string): boolean {
  let latinCount = 0
  let nonLatinCount = 0
  for (const ch of title) {
    const code = ch.codePointAt(0)!
    const isLatin = (code >= 0x0041 && code <= 0x005A)
      || (code >= 0x0061 && code <= 0x007A)
      || (code >= 0x00C0 && code <= 0x024F)
      || (code >= 0x1E00 && code <= 0x1EFF)
    const isCommon = code <= 0x007F
      || (code >= 0x2000 && code <= 0x2BFF)
      || (code >= 0xFE00 && code <= 0xFEFF)
      || (code >= 0x1F300 && code <= 0x1FAFF)
      || (code >= 0x200 && code <= 0x2FF)
      || ch === ' '
    if (isLatin || isCommon) latinCount++
    else nonLatinCount++
  }
  const total = latinCount + nonLatinCount
  return total > 0 && (nonLatinCount / total) > NON_LATIN_THRESHOLD
}

function isEnglishLanguage(video: YouTubeVideoItem): boolean {
  const lang = video.defaultAudioLanguage || video.defaultLanguage
  if (!lang) return true
  return lang.toLowerCase().startsWith('en')
}

export function qualifies(
  outlier: OutlierData,
  durationSec: number,
  title: string,
  filters: NicheFilterParams,
  video?: YouTubeVideoItem,
): boolean {
  if (outlier.ratio < filters.minRatio) return false
  if (outlier.views < filters.minViews) return false
  if (outlier.subs > filters.maxSubscribers) return false
  if (durationSec < filters.minDurationSec) return false
  if (durationSec > filters.maxDurationSec) return false
  if (excludeRegex.test(title)) return false
  if (hasNonLatinScript(title)) return false
  if (video && !isEnglishLanguage(video)) return false
  return true
}

export function nicheHeatScore(qualifyingHeats: number[]): number {
  const top5 = qualifyingHeats.sort((a, b) => b - a).slice(0, 5)
  if (top5.length === 0) return 0
  return top5.reduce((sum, h) => sum + h, 0) / top5.length
}

export const CATEGORY_RPM: Record<string, [number, number]> = {
  finance:            [22, 45],
  'ai-tools':         [11, 18],
  'business-stories': [14, 24],
  'true-crime':       [10, 17],
  history:            [7, 12],
  'family-drama':     [9, 15],
  'space-science':    [8, 13],
  'horror-stories':   [6, 10],
}

export function rpmForCategory(category: string): [number, number] {
  return CATEGORY_RPM[category] || [5, 10]
}

export function getWeekString(date: Date = new Date()): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

export { isoDurationToSeconds, clamp01 }
