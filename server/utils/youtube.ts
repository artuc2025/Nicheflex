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

interface YouTubeSearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    channelId: string
    channelTitle: string
    publishedAt: string
    description: string
  }
}

interface YouTubeVideoItem {
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
}

interface YouTubeChannelItem {
  id: string
  statistics: {
    subscriberCount: string
    videoCount: string
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
  const url = new URL(`${YOUTUBE_API}/videos`)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('part', 'statistics,contentDetails,snippet')
  url.searchParams.set('id', videoIds.join(','))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`YouTube videos error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.items || []
}

export async function getChannelDetails(apiKey: string, channelIds: string[]): Promise<YouTubeChannelItem[]> {
  const url = new URL(`${YOUTUBE_API}/channels`)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('part', 'statistics,snippet')
  url.searchParams.set('id', channelIds.join(','))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`YouTube channels error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.items || []
}

export function calcVPH(views: number, publishedAt: string): number {
  const hoursSincePublished = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60)
  if (hoursSincePublished < 1) return views
  return Math.round((views / hoursSincePublished) * 100) / 100
}

export function calcHeatScore(params: {
  viewsGrowth7d: number
  viewsGrowth30d: number
  rpmHigh: number
  channelsCount: number
}): number {
  const growth = params.viewsGrowth7d > 0 ? params.viewsGrowth7d / Math.max(params.viewsGrowth30d / 4, 1) : 0
  const monetization = params.rpmHigh / 10
  const competition = Math.max(params.channelsCount, 1)
  const raw = (growth * 0.4 + monetization * 0.4 + (1 / competition) * 0.2) * 100
  return Math.min(Math.round(raw * 100) / 100, 99.99)
}

export function getWeekString(date: Date = new Date()): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}
