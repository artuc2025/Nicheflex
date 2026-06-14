import { nicheBreakdownPrompt, scriptSkeletonPrompt, scriptPrompt } from '../prompts/flex'
import { retryGenerate } from './retryGenerate'
import type { NicheProfile } from './nicheProfiles'

export interface NicheInput {
  title: string
  category?: string
  format?: 'longform' | 'shorts'
  outliers?: Array<{ title: string; views: number; channelAgeDays?: number }>
  heat?: number
  rpmRange?: string
  slug?: string
  profile?: NicheProfile
  entryAngle?: string
  hookPattern?: string
}

export interface RunGenerationResult {
  payload: unknown
  provider: string
  model: string
  latencyMs: number
  totalAttempts: number
  infraRetries: number
  contractRetries: number
}

export async function runGeneration(
  type: 'breakdown' | 'skeleton' | 'script',
  niche: NicheInput,
  opts?: { targetMinutes?: number; skeleton?: Record<string, unknown> },
): Promise<RunGenerationResult> {
  const fmt = (niche.format ?? 'longform') as 'longform' | 'shorts'

  let aiReq

  if (type === 'breakdown') {
    const prompt = nicheBreakdownPrompt({
      title: niche.title,
      category: niche.category ?? 'general',
      format: fmt,
      outliers: niche.outliers ?? [],
      heat: niche.heat ?? 0,
      rpmRange: niche.rpmRange ?? 'N/A',
    })
    aiReq = { system: prompt.system, user: prompt.user, json: true as const, maxTokens: 4096 }
  } else if (type === 'script') {
    const prompt = scriptPrompt({
      skeleton: opts?.skeleton ?? {},
      profile: niche.profile,
    })
    aiReq = { system: prompt.system, user: prompt.user, json: true as const, maxTokens: 32768 }
  } else {
    const prompt = scriptSkeletonPrompt({
      nicheTitle: niche.title,
      format: fmt,
      targetMinutes: opts?.targetMinutes ?? 12,
      entryAngle: niche.entryAngle,
      hookPattern: niche.hookPattern,
      profile: niche.profile,
      topOutliers: niche.outliers?.slice(0, 3),
    })
    aiReq = { system: prompt.system, user: prompt.user, json: true as const, maxTokens: 8192 }
  }

  let result
  try {
    result = await retryGenerate(aiReq, { type, maxAttempts: 4 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(msg)
  }

  return {
    payload: result.parsed,
    provider: result.provider,
    model: result.model,
    latencyMs: result.latencyMs,
    totalAttempts: result.totalAttempts,
    infraRetries: result.infraRetries,
    contractRetries: result.contractRetries,
  }
}
