<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <nav class="border-b border-gray-800 px-6 py-4">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <h1 class="text-xl font-bold text-orange-500">NicheHeat</h1>
        <div class="flex gap-4">
          <NuxtLink v-if="user" to="/dashboard" class="text-sm text-gray-300 hover:text-white">
            Dashboard
          </NuxtLink>
          <NuxtLink v-if="!user" to="/login" class="text-sm text-gray-300 hover:text-white">
            Sign In
          </NuxtLink>
        </div>
      </div>
    </nav>

    <main class="mx-auto max-w-7xl px-6 py-20">
      <div class="text-center">
        <h2 class="text-5xl font-bold">
          From niche to script
          <span class="text-orange-500">in one click.</span>
        </h2>
        <p class="mt-6 text-xl text-gray-400">
          Analytics platform for faceless YouTube creators.
          Find hot niches, understand why they work, get script skeletons.
        </p>
        <div class="mt-10 flex justify-center gap-4">
          <NuxtLink
            to="/login"
            class="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Get Started Free
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
</script>
