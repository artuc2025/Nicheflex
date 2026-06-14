import { ofetch } from 'ofetch'
import { createError } from 'h3'

export interface AIRequest {
  system: string
  user: string
  maxTokens?: number
  temperature?: number
  /** if true, response is parsed as JSON (fences stripped) */
  json?: boolean
}

export interface AIResponse<T = unknown> {
  text: string
  parsed?: T
  provider: string
  model: string
  latencyMs: number
}

function stripFences(s: string): string {
  let t = s.trim()
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start !== -1 && end > start) {
    t = t.substring(start, end + 1)
  }
  return t
}

async function callAnthropic(req: AIRequest) {
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
  const res = await ofetch<any>('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: {
      model,
      max_tokens: req.maxTokens ?? 4096,
      temperature: req.temperature ?? 0.8,
      system: req.system,
      messages: [{ role: 'user', content: req.user }],
    },
  })
  const text = (res.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n')
  return { text, model }
}

async function callGemini(req: AIRequest) {
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
  const res = await ofetch<any>(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      body: {
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: 'user', parts: [{ text: req.user }] }],
        generationConfig: {
          maxOutputTokens: req.maxTokens ?? 4096,
          temperature: req.temperature ?? 0.8,
        },
      },
    },
  )
  const text = res.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') ?? ''
  return { text, model }
}

async function callFastAPI(req: AIRequest) {
  // Adapter for an external FastAPI AI service.
  // Adjust the path/payload to match your service contract.
  const res = await ofetch<any>(`${process.env.AI_SERVICE_URL}/generate`, {
    method: 'POST',
    headers: process.env.AI_SERVICE_KEY ? { Authorization: `Bearer ${process.env.AI_SERVICE_KEY}` } : {},
    body: {
      system: req.system,
      prompt: req.user,
      max_tokens: req.maxTokens ?? 4096,
      temperature: req.temperature ?? 0.8,
    },
  })
  return { text: res.text ?? res.output ?? '', model: res.model ?? 'fastapi-backend' }
}

export async function aiGenerate<T = unknown>(req: AIRequest): Promise<AIResponse<T>> {
  const provider = process.env.AI_PROVIDER ?? 'gemini'
  const t0 = Date.now()

  const { text, model } =
    provider === 'anthropic' ? await callAnthropic(req)
    : provider === 'fastapi' ? await callFastAPI(req)
    : await callGemini(req)

  const out: AIResponse<T> = { text, provider, model, latencyMs: Date.now() - t0 }

  if (req.json) {
    try {
      out.parsed = JSON.parse(stripFences(text)) as T
    } catch {
      console.error(`[aiGenerate] JSON parse failed (provider=${provider}, model=${model})`)
      console.error(`[aiGenerate] Raw response (first 500 chars): ${text.substring(0, 500)}`)
      throw createError({ statusCode: 502, message: `AI returned invalid JSON (provider=${provider})` })
    }
  }
  return out
}
