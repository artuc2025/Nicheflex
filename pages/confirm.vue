<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-950">
    <p class="text-gray-400">Confirming your identity...</p>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const router = useRouter()

watch(user, () => {
  if (user.value) {
    router.push('/dashboard')
  }
}, { immediate: true })
</script>
