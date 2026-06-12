import { createClient } from '@supabase/supabase-js'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader?.startsWith('Bearer ')) return

    const token = authHeader.slice(7)
    const supabase = createClient(
      process.env.NUXT_PUBLIC_SUPABASE_URL!,
      process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY!,
    )

    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) {
      event.context.user = user
    }
  })
})
