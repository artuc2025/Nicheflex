<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <nav class="border-b border-gray-800 px-6 py-4">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold text-orange-500">NicheHeat</NuxtLink>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-400">{{ user?.email }}</span>
          <button
            class="text-sm text-gray-300 hover:text-white"
            @click="signOut"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>

    <main class="mx-auto max-w-7xl px-6 py-10">
      <h2 class="text-2xl font-bold">Dashboard</h2>
      <p class="mt-2 text-gray-400">Coming soon: Niche Radar</p>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()

async function signOut() {
  await supabase.auth.signOut()
  navigateTo('/')
}
</script>
