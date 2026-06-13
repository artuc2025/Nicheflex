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

const niches = ref<NicheRow[]>([])
const loading = ref(true)
const scanning = ref(false)
const filterFormat = ref('')
const filterLanguage = ref('')
const selectedNiche = ref<NicheRow | null>(null)
const outliers = ref<OutlierRow[]>([])
const outlierLoading = ref(false)

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
  outlierLoading.value = true
  try {
    const data = await $fetch('/api/outliers', {
      params: { niche_id: niche.id, week: niche.week },
    })
    outliers.value = data as OutlierRow[]
  } finally {
    outlierLoading.value = false
  }
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

onMounted(fetchNiches)
</script>
