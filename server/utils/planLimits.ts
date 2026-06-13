import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

function getServiceClient() {
  return createClient(
    process.env.NUXT_PUBLIC_SUPABASE_URL!,
    process.env.NUXT_SUPABASE_SERVICE_KEY || process.env.NUXT_SUPABASE_SECRET_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY!,
  )
}

export const PLAN_LIMITS = {
  free: { breakdown: 1, skeleton: 0 },
  pro: { breakdown: Infinity, skeleton: 30 },
} as const

export type Plan = keyof typeof PLAN_LIMITS
export type GenType = 'breakdown' | 'skeleton'

export async function getUserPlan(_event: H3Event, userId: string): Promise<Plan> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('plan,status')
    .eq('user_id', userId)
    .in('status', ['active', 'on_trial'])
    .maybeSingle()
  return data?.plan === 'pro' ? 'pro' : 'free'
}

export async function assertGenerationAllowed(_event: H3Event, userId: string, type: GenType) {
  const plan = await getUserPlan(_event, userId)
  const limit = PLAN_LIMITS[plan][type]

  if (limit === 0) {
    throw createError({
      statusCode: 402,
      message: type === 'skeleton'
        ? 'Script skeletons are a Pro feature. Upgrade to generate yours.'
        : 'Upgrade to Pro to generate breakdowns.',
    })
  }
  if (limit === Infinity) return { plan, used: null, limit }

  const monthStart = new Date()
  monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0)

  const supabase = getServiceClient()
  const { count, error } = await supabase
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', monthStart.toISOString())

  if (error) throw createError({ statusCode: 500, message: 'Could not verify your quota. Try again.' })

  if ((count ?? 0) >= limit) {
    throw createError({
      statusCode: 402,
      message: plan === 'free'
        ? `Free plan includes ${limit} ${type} per month. Upgrade to Pro for more.`
        : `You have used all ${limit} ${type} generations this month. Quota resets on the 1st.`,
    })
  }
  return { plan, used: count ?? 0, limit }
}
