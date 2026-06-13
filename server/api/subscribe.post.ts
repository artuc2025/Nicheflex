import { serverSupabaseClient } from '#supabase/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_LENGTH = 254
const RATE_LIMIT = 5
const RATE_WINDOW = 60_000

const hits = new Map<string, number[]>()

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const now = Date.now()

  const timestamps = hits.get(ip) || []
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW)
  if (recent.length >= RATE_LIMIT) {
    throw createError({ statusCode: 429, message: 'Too many requests. Please try again in a minute.' })
  }
  recent.push(now)
  hits.set(ip, recent)

  const body = await readBody(event)

  if (body?.website) {
    return { ok: true }
  }

  const email = (body?.email || '').trim().toLowerCase()

  if (!email || email.length > MAX_LENGTH || !EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, message: 'Enter a valid email address.' })
  }

  const supabase = serverSupabaseClient(event)

  const { error } = await supabase
    .from('subscribers')
    .upsert({ email, source: 'landing', status: 'active' }, { onConflict: 'email' })

  if (error) {
    throw createError({ statusCode: 500, message: 'Could not save your email. Try again.' })
  }

  const resendKey = useRuntimeConfig().resendApiKey
  const resendFrom = useRuntimeConfig().resendFrom

  if (resendKey && resendFrom) {
    try {
      await $fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}` },
        body: {
          from: resendFrom,
          to: email,
          subject: 'Welcome to NicheHeat',
          text: `Hey!\n\nYou're on the NicheHeat list. We'll send you hot niches and script insights for faceless YouTube creators.\n\nTalk soon,\nThe NicheHeat Team\n\n---\nTo unsubscribe, reply with "unsubscribe" or email hello@${(resendFrom.split('<')[1] || 'nicheheat.com').replace('>', '')}.`,
        },
      })
    } catch (e) {
      console.error('[subscribe] Resend error:', e)
    }
  }

  return { ok: true }
})
