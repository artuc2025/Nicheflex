<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <nav class="border-b border-gray-800 px-6 py-4">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <h1 class="text-xl font-bold text-orange-500">NicheHeat</h1>
        <div class="flex gap-4">
          <NuxtLink v-if="user" to="/app" class="text-sm text-gray-300 hover:text-white">
            Dashboard
          </NuxtLink>
          <NuxtLink v-if="!user" to="/login" class="text-sm text-gray-300 hover:text-white">
            Sign In
          </NuxtLink>
        </div>
      </div>
    </nav>

    <main class="mx-auto max-w-5xl px-6 py-20">
      <section class="text-center">
        <h2 class="text-5xl font-bold leading-tight">
          From niche to script
          <span class="text-orange-500">in one click.</span>
        </h2>
        <p class="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
          Analytics platform for faceless YouTube creators.
          Find hot niches, understand why they work, get script skeletons.
        </p>
      </section>

      <section class="mt-16" aria-label="Trending niches">
        <h3 class="text-center text-sm font-semibold uppercase tracking-widest text-gray-500 mb-6">
          This week's hottest niches
        </h3>
        <div
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
          role="img"
          aria-label="Thermal strip showing trending niche heat scores"
        >
          <div
            v-for="niche in demoNiches"
            :key="niche.title"
            class="relative overflow-hidden rounded-xl border border-gray-800 p-4 transition-transform hover:scale-105"
            :class="heatBg(niche.heat)"
          >
            <div class="text-xs text-gray-400 mb-1">{{ niche.views }}</div>
            <div class="font-semibold text-sm">{{ niche.title }}</div>
            <div class="mt-2 text-2xl font-bold" :class="heatColor(niche.heat)">
              {{ niche.heat.toFixed(1) }}
            </div>
            <div class="text-xs text-gray-500 mt-1">HEAT</div>
          </div>
        </div>
        <p class="text-center text-xs text-gray-600 mt-4">
          Demo data — live scan data coming soon
        </p>
      </section>

      <section class="mt-20 max-w-md mx-auto text-center">
        <h3 class="text-2xl font-bold mb-3">Get early access</h3>
        <p class="text-gray-400 mb-6 text-sm">
          Join the waitlist. We'll email you when NicheHeat launches — no spam, ever.
        </p>

        <form v-if="formState === 'idle' || formState === 'error'" @submit.prevent="subscribe">
          <div class="flex gap-2">
            <input
              v-model="email"
              type="email"
              inputmode="email"
              autocomplete="email"
              required
              placeholder="you@example.com"
              class="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              :disabled="formState === 'sending'"
            />
            <button
              type="submit"
              :disabled="formState === 'sending'"
              class="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {{ formState === 'sending' ? 'Sending…' : 'Join Waitlist' }}
            </button>
          </div>
          <div class="absolute -left-[9999px]" aria-hidden="true">
            <input v-model="honeypot" type="text" name="website" tabindex="-1" autocomplete="off" />
          </div>
          <p v-if="formState === 'error'" class="mt-2 text-sm text-red-400">{{ errorMsg }}</p>
        </form>

        <div v-else class="rounded-lg border border-green-500/30 bg-green-500/10 p-6">
          <p class="text-green-400 font-semibold">You're on the list!</p>
          <p class="text-sm text-gray-400 mt-2">
            Check your inbox for a welcome email. Add us to contacts to avoid spam folders.
          </p>
        </div>
      </section>

      <section class="mt-20 text-center">
        <NuxtLink
          v-if="!user"
          to="/login"
          class="inline-block rounded-lg border border-gray-700 px-6 py-3 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
        >
          Already have an account? Sign in
        </NuxtLink>
        <NuxtLink
          v-else
          to="/app"
          class="inline-block rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Open Dashboard
        </NuxtLink>
      </section>
    </main>

    <footer class="border-t border-gray-800 py-8 text-center text-xs text-gray-600">
      NicheHeat — niche analytics for faceless YouTube creators
    </footer>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()

const email = ref('')
const honeypot = ref('')
const formState = ref<'idle' | 'sending' | 'done' | 'error'>('idle')
const errorMsg = ref('')

const demoNiches = [
  { title: 'AI Tools Reviews', heat: 72.4, views: '1.2M' },
  { title: 'Dark History', heat: 65.8, views: '890K' },
  { title: 'Reddit Stories', heat: 61.2, views: '2.1M' },
  { title: 'Scary Mysteries', heat: 58.9, views: '670K' },
  { title: 'Satisfying Compilations', heat: 54.1, views: '3.4M' },
]

function heatBg(score: number) {
  if (score >= 65) return 'bg-red-500/10'
  if (score >= 55) return 'bg-orange-500/10'
  return 'bg-yellow-500/10'
}

function heatColor(score: number) {
  if (score >= 65) return 'text-red-400'
  if (score >= 55) return 'text-orange-400'
  return 'text-yellow-400'
}

async function subscribe() {
  if (!email.value.trim()) return
  formState.value = 'sending'
  errorMsg.value = ''

  try {
    const res = await $fetch('/api/subscribe', {
      method: 'POST',
      body: { email: email.value.trim(), website: honeypot.value },
    })
    if ((res as { ok: boolean }).ok) {
      formState.value = 'done'
      email.value = ''
    }
  } catch (e: any) {
    formState.value = 'error'
    errorMsg.value = e?.data?.message || 'Something went wrong. Try again.'
  }
}
</script>
