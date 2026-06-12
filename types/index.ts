export interface Niche {
  id: string
  slug: string
  title: string
  language: string
  format: 'long' | 'shorts'
  created_at: string
}

export interface NicheSnapshot {
  id: string
  niche_id: string
  week: string
  heat_score: number
  rpm_low: number
  rpm_high: number
  views_7d: number
  views_30d: number
  channels_count: number
  avg_channel_age_days: number
}

export interface OutlierVideo {
  id: string
  niche_id: string
  yt_video_id: string
  title: string
  views: number
  vph: number
  channel_id: string
  published_at: string
  snapshot_week: string
}

export interface UserProfile {
  id: string
  plan: 'free' | 'pro'
  generations_used: number
}

export interface Subscription {
  id: string
  user_id: string
  ls_subscription_id: string
  plan: 'free' | 'pro'
  status: string
  renews_at: string
}

export interface Generation {
  id: string
  user_id: string
  niche_id: string
  type: 'breakdown' | 'skeleton'
  payload_json: Record<string, unknown>
  created_at: string
}
