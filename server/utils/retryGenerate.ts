import { createError } from 'h3'
import { aiGenerate, type AIRequest, type AIResponse } from './aiProvider'
import { validateBreakdown, validateSkeleton, type ValidationIssues } from './validateGeneration'

export interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  type: 'breakdown' | 'skeleton'
}

export interface RetryResult<T = unknown> extends AIResponse<T> {
  issues?: ValidationIssues
  totalAttempts: number
  infraRetries: number
  contractRetries: number
}

const validators = {
  breakdown: validateBreakdown,
  skeleton: validateSkeleton,
}

function isTransientError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as Record<string, unknown>
  const status = e.statusCode ?? e.status ?? e.statusMessage
  if (typeof status === 'number' && [429, 500, 502, 503, 504].includes(status)) return true
  const msg = typeof e.message === 'string' ? e.message.toLowerCase() : ''
  if (msg.includes('503') || msg.includes('502') || msg.includes('429') || msg.includes('overloaded') || msg.includes('unavailable')) return true
  return false
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
  return base + Math.random() * base * 0.3
}

const TRANSIENT_BACKOFF_MS = [3000, 8000, 20000]

export async function retryGenerate(
  req: AIRequest,
  opts: RetryOptions,
): Promise<RetryResult> {
  const maxAttempts = opts.maxAttempts ?? 3
  const baseDelay = opts.baseDelayMs ?? 500
  const validate = validators[opts.type]
  let lastErr: unknown = null
  let totalAttempts = 0
  let infraRetries = 0
  let contractRetries = 0

  let currentReq: AIRequest = { ...req }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    totalAttempts = attempt
    try {
      const res = await aiGenerate(currentReq)

      const issues = validate(res.parsed)
      if (issues.length === 0) {
        return { ...res, totalAttempts, infraRetries, contractRetries }
      }

      lastErr = { statusCode: 422, message: `Contract failed: ${issues.join('; ')}` }
      contractRetries++

      if (contractRetries >= 2) {
        console.log(`[retryGenerate] contract retries exhausted (${contractRetries}), giving up`)
        break
      }

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

      if (isTransientError(err)) {
        infraRetries++
        if (infraRetries >= TRANSIENT_BACKOFF_MS.length) {
          console.log(`[retryGenerate] transient retries exhausted (${infraRetries}), giving up`)
          break
        }
        const backoff = TRANSIENT_BACKOFF_MS[infraRetries - 1]
        console.log(`[retryGenerate] attempt ${attempt} transient error, backoff ${backoff/1000}s...`, (err as Error).message?.substring(0, 120))
        await new Promise(r => setTimeout(r, backoff))
      } else if (attempt < maxAttempts) {
        console.log(`[retryGenerate] attempt ${attempt} error, retrying...`, (err as Error).message?.substring(0, 120))
        const delay = jitter(baseDelay * Math.pow(2, attempt - 1))
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }

  const reason = contractRetries >= 2 ? 'contract' : 'infra'
  const detail = lastErr instanceof Error ? lastErr.message : String(lastErr)
  const msg = `Generation failed after ${totalAttempts} attempts (${reason}): ${detail}`
  const err = createError({ statusCode: 422, message: msg })
  ;(err as any).toString = () => msg
  throw err
}
