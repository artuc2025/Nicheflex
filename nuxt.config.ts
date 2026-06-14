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
    adminUserId: '',
    resendApiKey: '',
    resendFrom: '',
    public: {
      siteUrl: '',
      adminUserId: '',
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

  routeRules: {
    '/api/generate': { maxDuration: 60 },
  },

  devtools: { enabled: true },
})
