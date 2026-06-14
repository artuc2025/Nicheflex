<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <nav class="border-b border-gray-800 px-6 py-4">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold text-orange-500">NicheHeat</NuxtLink>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-400">{{ user?.email }}</span>
          <button class="text-sm text-gray-300 hover:text-white" @click="signOut">Sign Out</button>
        </div>
      </div>
    </nav>

    <main class="mx-auto max-w-7xl px-6 py-10">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">Niche Radar</h1>
          <p class="mt-1 text-gray-400">Week {{ currentWeek }} · {{ niches.length }} niches scanned</p>
        </div>
        <button
          class="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold hover:bg-orange-600"
          @click="runScan"
          :disabled="scanning"
        >
          {{ scanning ? 'Scanning...' : 'Scan Now' }}
        </button>
      </div>

      <div class="mb-6 flex gap-3">
        <select v-model="filterFormat" class="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-300">
          <option value="">All formats</option>
          <option value="long">Long-form</option>
          <option value="shorts">Shorts</option>
        </select>
        <select v-model="filterLanguage" class="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-300">
          <option value="">All languages</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="ru">Russian</option>
        </select>
      </div>

      <div v-if="loading" class="py-20 text-center text-gray-400">Loading niches...</div>

      <div v-else class="overflow-hidden rounded-xl border border-gray-800">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-gray-800 bg-gray-900/50">
            <tr>
              <th class="px-4 py-3 font-medium text-gray-400">Niche</th>
              <th class="px-4 py-3 font-medium text-gray-400 text-right">HEAT</th>
              <th class="px-4 py-3 font-medium text-gray-400 text-right">RPM</th>
              <th class="px-4 py-3 font-medium text-gray-400 text-right">Views 7d</th>
              <th class="px-4 py-3 font-medium text-gray-400 text-right">Views 30d</th>
              <th class="px-4 py-3 font-medium text-gray-400 text-right">Channels</th>
              <th class="px-4 py-3 font-medium text-gray-400 text-right">Avg Age</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="niche in filteredNiches"
              :key="niche.id"
              class="border-b border-gray-800/50 hover:bg-gray-900/50 cursor-pointer"
              @click="openNiche(niche)"
            >
              <td class="px-4 py-3">
                <div class="font-medium">{{ niche.title }}</div>
                <div class="text-xs text-gray-500">{{ niche.category }}</div>
              </td>
              <td class="px-4 py-3 text-right">
                <span
                  class="inline-block rounded px-2 py-0.5 text-xs font-bold"
                  :class="heatClass(niche.heat_score)"
                >
                  {{ niche.heat_score.toFixed(1) }}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-gray-300">
                ${{ niche.rpm_low }}–${{ niche.rpm_high }}
              </td>
              <td class="px-4 py-3 text-right text-gray-300">{{ formatViews(niche.views_7d) }}</td>
              <td class="px-4 py-3 text-right text-gray-300">{{ formatViews(niche.views_30d) }}</td>
              <td class="px-4 py-3 text-right text-gray-300">{{ niche.channels_count }}</td>
              <td class="px-4 py-3 text-right text-gray-300">{{ formatAge(niche.avg_channel_age_days) }}</td>
              <td class="px-4 py-3 text-right">
                <span class="text-orange-500 text-xs">View →</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && filteredNiches.length === 0" class="py-20 text-center text-gray-400">
        No niches match your filters.
      </div>

      <div class="mt-12 border-t border-gray-800 pt-8">
        <h2 class="mb-4 text-xl font-bold">Generation History</h2>
        <div v-if="historyLoading" class="py-6 text-center text-gray-500">Loading history...</div>
        <div v-else-if="history.length === 0" class="py-6 text-center text-gray-500">No generations yet.</div>
        <div v-else class="space-y-2">
          <div
            v-for="gen in history"
            :key="gen.id"
            class="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3 cursor-pointer hover:bg-gray-800/50"
            @click="openHistoryItem(gen)"
          >
            <div>
              <div class="text-sm font-medium">{{ gen.niche_title }}</div>
              <div class="text-xs text-gray-500">{{ new Date(gen.created_at).toLocaleDateString() }} · {{ gen.type }}</div>
            </div>
            <span class="text-xs text-orange-400">View →</span>
          </div>
        </div>
      </div>
    </main>

    <Teleport to="body">
      <div
        v-if="selectedNiche"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        @click.self="selectedNiche = null"
      >
        <div class="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-6">
          <div class="mb-4 flex items-start justify-between">
            <div>
              <h2 class="text-2xl font-bold">{{ selectedNiche.title }}</h2>
              <p class="text-sm text-gray-400">{{ selectedNiche.category }} · {{ selectedNiche.language }}</p>
            </div>
            <button class="text-gray-400 hover:text-white text-xl" @click="selectedNiche = null">✕</button>
          </div>

          <div class="mb-6 grid grid-cols-4 gap-3">
            <div class="rounded-lg bg-gray-800 p-3 text-center">
              <div class="text-xs text-gray-400">HEAT</div>
              <div class="text-xl font-bold" :class="heatTextColor(selectedNiche.heat_score)">
                {{ selectedNiche.heat_score.toFixed(1) }}
              </div>
            </div>
            <div class="rounded-lg bg-gray-800 p-3 text-center">
              <div class="text-xs text-gray-400">RPM</div>
              <div class="text-xl font-bold text-green-400">${{ selectedNiche.rpm_low }}–{{ selectedNiche.rpm_high }}</div>
            </div>
            <div class="rounded-lg bg-gray-800 p-3 text-center">
              <div class="text-xs text-gray-400">Views 7d</div>
              <div class="text-xl font-bold text-blue-400">{{ formatViews(selectedNiche.views_7d) }}</div>
            </div>
            <div class="rounded-lg bg-gray-800 p-3 text-center">
              <div class="text-xs text-gray-400">Channels</div>
              <div class="text-xl font-bold text-purple-400">{{ selectedNiche.channels_count }}</div>
            </div>
          </div>

          <div class="mb-6 flex gap-3">
            <button
              class="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="generatingFor === selectedNiche.id"
              @click="generateForNiche(selectedNiche, 'breakdown')"
            >
              <svg v-if="generatingFor === selectedNiche.id && generatingType === 'breakdown'" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ savedBreakdown ? 'Regenerate' : 'Generate' }} Breakdown
            </button>
            <button
              class="flex items-center gap-2 rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-400 hover:bg-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="generatingFor === selectedNiche.id"
              @click="generateForNiche(selectedNiche, 'skeleton')"
            >
              <svg v-if="generatingFor === selectedNiche.id && generatingType === 'skeleton'" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ savedSkeleton ? 'Regenerate' : 'Generate' }} Skeleton
            </button>
          </div>

          <div v-if="genError" class="mb-4 rounded-lg border p-4 text-sm" :class="genErrorClass">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ genError }}</span>
            </div>
            <div v-if="genErrorCode === 402" class="mt-2">
              <a href="#" class="inline-block rounded bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600">Upgrade to Pro</a>
            </div>
            <div v-if="genErrorCode === 500 || genErrorCode === 422" class="mt-2">
              <button class="text-xs text-orange-400 underline" @click="retryLastGeneration">Try again</button>
            </div>
          </div>

          <div v-if="activeBreakdown" class="mb-6 space-y-4">
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-bold text-orange-400">Niche Breakdown</h3>
              <span v-if="savedBreakdownDate && !genResult" class="text-xs text-gray-500">Generated {{ timeAgo(savedBreakdownDate) }}</span>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Why It Works</h4>
              <p class="mt-1 text-sm text-gray-300">{{ activeBreakdown!.why_it_works }}</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Narrative Mechanics</h4>
              <ul class="mt-1 space-y-1">
                <li v-for="(m, i) in activeBreakdown!.narrative_mechanics" :key="i" class="flex items-start gap-2 text-sm text-gray-300">
                  <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  {{ m }}
                </li>
              </ul>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Hook Patterns</h4>
              <div class="mt-1 space-y-2">
                <div v-for="(h, i) in activeBreakdown!.hook_patterns" :key="i" class="rounded-lg bg-gray-800/50 px-3 py-2 text-sm text-gray-300">
                  {{ h }}
                </div>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Audience Psychology</h4>
              <p class="mt-1 text-sm text-gray-300">{{ activeBreakdown!.audience_psychology }}</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Saturation Risk</h4>
              <div class="mt-1 flex items-center gap-2">
                <span class="inline-block rounded px-2 py-0.5 text-xs font-bold" :class="{
                  'bg-green-500/20 text-green-400': activeBreakdown!.saturation_risk.level === 'low',
                  'bg-yellow-500/20 text-yellow-400': activeBreakdown!.saturation_risk.level === 'medium',
                  'bg-red-500/20 text-red-400': activeBreakdown!.saturation_risk.level === 'high',
                }">{{ activeBreakdown!.saturation_risk.level }}</span>
                <span class="text-xs text-gray-500">Window: {{ activeBreakdown!.saturation_risk.window_estimate }}</span>
              </div>
              <p class="mt-1 text-sm text-gray-400">{{ activeBreakdown!.saturation_risk.reasoning }}</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Entry Angle</h4>
              <p class="mt-1 text-sm text-gray-300">{{ activeBreakdown!.entry_angle }}</p>
            </div>
            <div v-if="activeBreakdown!.red_flags?.length">
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Red Flags</h4>
              <ul class="mt-1 space-y-1">
                <li v-for="(f, i) in activeBreakdown!.red_flags" :key="i" class="flex items-start gap-2 text-sm text-red-400">
                  <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  {{ f }}
                </li>
              </ul>
            </div>
          </div>

          <div v-if="activeSkeleton" class="mb-6 space-y-4">
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-bold text-orange-400">Script Skeleton</h3>
              <span v-if="savedSkeletonDate && !genResult" class="text-xs text-gray-500">Generated {{ timeAgo(savedSkeletonDate) }}</span>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Title Options</h4>
              <div class="mt-1 space-y-1">
                <div v-for="(t, i) in activeSkeleton!.title_options" :key="i" class="rounded-lg bg-gray-800/50 px-3 py-2 text-sm text-gray-300">
                  {{ t }}
                </div>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Hook</h4>
              <div class="mt-1 rounded-lg bg-gray-800/50 p-3 space-y-1">
                <p class="text-sm text-orange-300">"{{ activeSkeleton!.hook.spoken_line }}"</p>
                <p class="text-xs text-gray-400">Visual: {{ activeSkeleton!.hook.visual_note }}</p>
                <p class="text-xs text-gray-500 italic">Q: {{ activeSkeleton!.hook.open_question }}</p>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Mystery Object</h4>
              <p class="mt-1 text-sm text-gray-300">{{ activeSkeleton!.mystery_object.what }} <span class="text-gray-500">(Act {{ activeSkeleton!.mystery_object.first_mention_act }} → reveal Act {{ activeSkeleton!.mystery_object.reveal_act }})</span></p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Acts</h4>
              <div class="mt-2 space-y-3">
                <div v-for="act in activeSkeleton!.acts" :key="act.n">
                  <div class="flex items-center gap-3 mb-1">
                    <span class="text-xs font-bold text-orange-400">Act {{ act.n }}</span>
                    <span class="text-xs text-gray-500">{{ act.label }}</span>
                    <span class="text-xs text-gray-600">{{ act.start_pct }}%–{{ act.end_pct }}%</span>
                  </div>
                  <div class="h-3 w-full overflow-hidden rounded-full bg-gray-800">
                    <div class="h-full rounded-full transition-all" :class="{
                      'bg-orange-500': act.n % 3 === 1,
                      'bg-orange-400': act.n % 3 === 2,
                      'bg-orange-300': act.n % 3 === 0,
                    }" :style="{ width: (act.end_pct - act.start_pct) + '%', marginLeft: act.start_pct + '%' }" />
                  </div>
                  <ul class="mt-1 space-y-0.5 pl-4">
                    <li v-for="(beat, bi) in act.beats" :key="bi" class="text-xs text-gray-400">• {{ beat }}</li>
                  </ul>
                  <p v-if="act.loop_tightener" class="mt-1 text-xs text-orange-400/70 italic">Loop tightener: {{ act.loop_tightener }}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Reveal</h4>
              <p class="mt-1 text-sm text-gray-300">{{ activeSkeleton!.reveal.what_changes }}</p>
              <p class="text-xs text-gray-500">Recontextualizes scenes {{ activeSkeleton!.reveal.recontextualizes_scenes.join(', ') }}</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Counterattack Waves</h4>
              <ul class="mt-1 space-y-1">
                <li v-for="(w, i) in activeSkeleton!.counterattack_waves" :key="i" class="text-sm text-gray-300">{{ w }}</li>
              </ul>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Narrator Asides</h4>
              <ul class="mt-1 space-y-1">
                <li v-for="(a, i) in activeSkeleton!.narrator_asides" :key="i" class="text-sm text-gray-300 italic">"{{ a }}"</li>
              </ul>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">CTA</h4>
              <p class="mt-1 text-sm text-gray-300">{{ activeSkeleton!.cta }}</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 uppercase tracking-wide">Authenticity Checklist</h4>
              <ul class="mt-1 space-y-1">
                <li v-for="(c, i) in activeSkeleton!.authenticity_checklist" :key="i" class="flex items-start gap-2 text-sm text-gray-300">
                  <span class="mt-1 text-green-400">✓</span>
                  {{ c }}
                </li>
              </ul>
            </div>
          </div>

          <h3 class="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wide">Top 5 Outlier Videos</h3>
          <div v-if="outlierLoading" class="py-6 text-center text-gray-500">Loading...</div>
          <div v-else class="space-y-2">
            <div
              v-for="(video, i) in outliers"
              :key="video.id"
              class="flex items-center gap-3 rounded-lg bg-gray-800/50 px-4 py-3"
            >
              <span class="text-lg font-bold text-gray-600 w-6 text-center">{{ i + 1 }}</span>
              <div class="flex-1 min-w-0">
                <div class="truncate text-sm font-medium">{{ video.title }}</div>
                <div class="text-xs text-gray-500">{{ video.channel_name }}</div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-sm font-semibold text-orange-400">{{ formatViews(video.views) }}</div>
                <div class="text-xs text-gray-500">{{ video.vph.toFixed(0) }} vph</div>
              </div>
            </div>
            <div v-if="outliers.length === 0" class="py-6 text-center text-gray-500">No outlier data yet.</div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()

interface NicheRow {
  id: string
  slug: string
  title: string
  language: string
  format: string
  category: string
  heat_score: number
  rpm_low: number
  rpm_high: number
  views_7d: number
  views_30d: number
  channels_count: number
  avg_channel_age_days: number
  week: string | null
}

interface OutlierRow {
  id: string
  yt_video_id: string
  title: string
  views: number
  vph: number
  channel_name: string
  published_at: string
}

interface HistoryRow {
  id: string
  niche_id: string
  niche_title: string
  type: 'breakdown' | 'skeleton'
  payload_json: Record<string, unknown>
  created_at: string
}

const niches = ref<NicheRow[]>([])
const loading = ref(true)
const scanning = ref(false)
const filterFormat = ref('')
const filterLanguage = ref('')
const selectedNiche = ref<NicheRow | null>(null)
const outliers = ref<OutlierRow[]>([])
const outlierLoading = ref(false)

const generatingFor = ref<string | null>(null)
const generatingType = ref<'breakdown' | 'skeleton' | null>(null)
const genResult = ref<Record<string, unknown> | null>(null)
const genResultType = ref<'breakdown' | 'skeleton' | null>(null)
const genError = ref('')
const genErrorCode = ref<number | null>(null)
const lastGenerationNicheId = ref<string | null>(null)
const lastGenerationType = ref<'breakdown' | 'skeleton' | null>(null)

const savedBreakdown = ref<Record<string, unknown> | null>(null)
const savedSkeleton = ref<Record<string, unknown> | null>(null)
const savedBreakdownDate = ref<string | null>(null)
const savedSkeletonDate = ref<string | null>(null)

const history = ref<HistoryRow[]>([])
const historyLoading = ref(false)

const currentWeek = computed(() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
})

const filteredNiches = computed(() => {
  return niches.value.filter((n) => {
    if (filterFormat.value && n.format !== filterFormat.value) return false
    if (filterLanguage.value && n.language !== filterLanguage.value) return false
    return true
  })
})

const genErrorClass = computed(() => {
  if (genErrorCode.value === 402) return 'border-orange-500/30 bg-orange-500/10 text-orange-300'
  if (genErrorCode.value === 429) return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
  return 'border-red-500/30 bg-red-500/10 text-red-300'
})

const activeBreakdown = computed(() => genResult.value && genResultType.value === 'breakdown' ? genResult.value : savedBreakdown.value)
const activeSkeleton = computed(() => genResult.value && genResultType.value === 'skeleton' ? genResult.value : savedSkeleton.value)

function heatClass(score: number) {
  if (score >= 60) return 'bg-red-500/20 text-red-400'
  if (score >= 50) return 'bg-orange-500/20 text-orange-400'
  return 'bg-yellow-500/20 text-yellow-400'
}

function heatTextColor(score: number) {
  if (score >= 60) return 'text-red-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-yellow-400'
}

function formatViews(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function formatAge(days: number) {
  if (days >= 365) return Math.round(days / 365) + 'y'
  if (days >= 30) return Math.round(days / 30) + 'mo'
  return days + 'd'
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

async function loadSavedGenerations(nicheId: string) {
  if (!user.value?.id) return
  const { data } = await supabase
    .from('generations')
    .select('type, payload_json, created_at')
    .eq('user_id', user.value.id)
    .eq('niche_id', nicheId)
    .order('created_at', { ascending: false })
    .limit(2)

  if (!data) return
  for (const row of data as Array<{ type: string; payload_json: Record<string, unknown>; created_at: string }>) {
    if (row.type === 'breakdown' && !savedBreakdown.value) {
      savedBreakdown.value = row.payload_json
      savedBreakdownDate.value = row.created_at
    } else if (row.type === 'skeleton' && !savedSkeleton.value) {
      savedSkeleton.value = row.payload_json
      savedSkeletonDate.value = row.created_at
    }
  }
}

async function fetchNiches() {
  loading.value = true
  try {
    const data = await $fetch('/api/niches')
    niches.value = data as NicheRow[]
  } finally {
    loading.value = false
  }
}

async function openNiche(niche: NicheRow) {
  selectedNiche.value = niche
  genResult.value = null
  genResultType.value = null
  genError.value = ''
  genErrorCode.value = null
  savedBreakdown.value = null
  savedSkeleton.value = null
  savedBreakdownDate.value = null
  savedSkeletonDate.value = null
  outlierLoading.value = true
  try {
    await Promise.all([
      (async () => {
        const data = await $fetch('/api/outliers', {
          params: { niche_id: niche.id, week: niche.week },
        })
        outliers.value = data as OutlierRow[]
      })(),
      loadSavedGenerations(niche.id),
    ])
  } finally {
    outlierLoading.value = false
  }
}

async function generateForNiche(niche: NicheRow, type: 'breakdown' | 'skeleton') {
  if (generatingFor.value) return
  generatingFor.value = niche.id
  generatingType.value = type
  genResult.value = null
  genResultType.value = null
  genError.value = ''
  genErrorCode.value = null
  lastGenerationNicheId.value = niche.id
  lastGenerationType.value = type

  try {
    const body: Record<string, unknown> = { type, nicheId: niche.id }
    if (type === 'skeleton') body.targetMinutes = 12

    const res = await $fetch('/api/generate', {
      method: 'POST',
      body,
    })

    genResult.value = (res as any).payload
    genResultType.value = type
    if (type === 'breakdown') {
      savedBreakdown.value = (res as any).payload
      savedBreakdownDate.value = new Date().toISOString()
    } else {
      savedSkeleton.value = (res as any).payload
      savedSkeletonDate.value = new Date().toISOString()
    }
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode
    if (status === 401) {
      navigateTo('/login')
      return
    }
    genErrorCode.value = status
    if (status === 402) {
      genError.value = err?.response?._data?.message || err?.data?.message || 'Upgrade to Pro to continue generating.'
    } else if (status === 422) {
      genError.value = 'The model couldn\'t produce a valid result — try again.'
    } else if (status === 429) {
      genError.value = 'Too many requests, slow down.'
    } else {
      genError.value = 'Something went wrong. Please try again.'
    }
  } finally {
    generatingFor.value = null
    generatingType.value = null
  }
}

function retryLastGeneration() {
  if (!lastGenerationNicheId.value || !lastGenerationType.value) return
  const niche = niches.value.find(n => n.id === lastGenerationNicheId.value)
  if (niche) {
    generateForNiche(niche, lastGenerationType.value)
  }
}

async function fetchHistory() {
  if (!user.value?.id) return
  historyLoading.value = true
  try {
    const { data, error } = await supabase
      .from('generations')
      .select('id, niche_id, type, payload_json, created_at, niches!inner(title)')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    history.value = (data || []).map((row: any) => ({
      id: row.id,
      niche_id: row.niche_id,
      niche_title: row.niches?.title || 'Unknown',
      type: row.type,
      payload_json: row.payload_json,
      created_at: row.created_at,
    }))
  } finally {
    historyLoading.value = false
  }
}

function openHistoryItem(gen: HistoryRow) {
  genResult.value = gen.payload_json
  genResultType.value = gen.type
  genError.value = ''
  genErrorCode.value = null
}

async function runScan() {
  scanning.value = true
  try {
    await $fetch('/api/scan', { method: 'POST' })
    await fetchNiches()
  } finally {
    scanning.value = false
  }
}

async function signOut() {
  await supabase.auth.signOut()
  navigateTo('/')
}

watch(user, (u) => {
  if (u?.id) fetchHistory()
}, { immediate: true })

onMounted(() => {
  fetchNiches()
})
</script>
