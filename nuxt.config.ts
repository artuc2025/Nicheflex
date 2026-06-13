export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
  ],

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: undefined,
      exclude: ['/', '/login', '/confirm', '/api/subscribe'],
    },
  },

  runtimeConfig: {
    youtubeApiKey: '',
    anthropicApiKey: '',
    resendApiKey: '',
    resendFrom: '',
    public: {
      siteUrl: '',
    },
  },

  app: {
    head: {
      title: 'NicheHeat',
      meta: [
        { name: 'description', content: 'Niche analytics + script skeletons for faceless YouTube creators' },
      ],
    },
  },

  devtools: { enabled: true },
})
