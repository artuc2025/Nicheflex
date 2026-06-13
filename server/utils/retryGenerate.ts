import { aiGenerate, type AIRequest, type AIResponse } from './aiProvider'
import { validateBreakdown, validateSkeleton, type ValidationIssues } from './validateGeneration'

export interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  type: 'breakdown' | 'skeleton'
}

const validators = {
  breakdown: validateBreakdown,
  skeleton: validateSkeleton,
}

function isNonRetryable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as Record<string, unknown>
  const status = e.statusCode ?? e.status ?? e.statusMessage
  if (typeof status === 'number' && [401, 403, 400].includes(status)) return true
  const msg = typeof e.message === 'string' ? e.message.toLowerCase() : ''
  if (msg.includes('auth') || msg.includes('quota') || msg.includes('bad key') || msg.includes('invalid api key')) return true
  return false
}

function jitter(base: number): number {
  return base + Math.random() * base * 0.5
}

export async function retryGenerate(
  req: AIRequest,
  opts: RetryOptions,
): Promise<AIResponse & { issues?: ValidationIssues }> {
  const maxAttempts = opts.maxAttempts ?? 3
  const baseDelay = opts.baseDelayMs ?? 500
  const validate = validators[opts.type]
  let lastErr: unknown = null

  let currentReq: AIRequest = { ...req }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await aiGenerate(currentReq)

      const issues = validate(res.parsed)
      if (issues.length === 0) {
        return { ...res }
      }

      lastErr = { statusCode: 422, message: `Contract failed: ${issues.join('; ')}` }

      if (attempt < maxAttempts) {
        const issueText = issues.join('; ')
        currentReq = {
          ...currentReq,
          user: currentReq.user + `\n\nPREVIOUS OUTPUT INVALID: ${issueText}. Return corrected JSON only.`,
        }
        console.log(`[retryGenerate] attempt ${attempt} contract fail, retrying...`)
        const delay = jitter(baseDelay * Math.pow(2, attempt - 1))
        await new Promise(r => setTimeout(r, delay))
      }
    } catch (err: unknown) {
      lastErr = err

      if (isNonRetryable(err)) {
        throw err
      }

      if (attempt < maxAttempts) {
        console.log(`[retryGenerate] attempt ${attempt} error, retrying...`, (err as Error).message)
        const delay = jitter(baseDelay * Math.pow(2, attempt - 1))
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }

  throw createError({
    statusCode: 422,
    message: `Generation failed validation after ${maxAttempts} attempts: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
  })
}
