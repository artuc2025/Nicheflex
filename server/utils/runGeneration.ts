import { nicheBreakdownPrompt, scriptSkeletonPrompt } from '../prompts/flex'
import { retryGenerate } from './retryGenerate'

export interface NicheInput {
  title: string
  category?: string
  format?: 'longform' | 'shorts'
  outliers?: Array<{ title: string; views: number; channelAgeDays?: number }>
  heat?: number
  rpmRange?: string
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
  type: 'breakdown' | 'skeleton',
  niche: NicheInput,
  opts?: { targetMinutes?: number },
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
  } else {
    const prompt = scriptSkeletonPrompt({
      nicheTitle: niche.title,
      format: fmt,
      targetMinutes: opts?.targetMinutes ?? 12,
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
