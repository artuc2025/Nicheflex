import 'dotenv/config'
import { runGeneration, type NicheInput } from '../server/utils/runGeneration'
import { validateBreakdown, validateSkeleton } from '../server/utils/validateGeneration'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const NICHES: NicheInput[] = [
  {
    title: 'AI Tools & Productivity',
    category: 'technology',
    format: 'longform',
    heat: 82,
    rpmRange: '$8–$15',
    outliers: [
      { title: 'I Replaced My Entire Workflow With AI — Here\'s What Happened', views: 2400000 },
      { title: '5 AI Tools Nobody Talks About (But Everyone Needs)', views: 1800000 },
      { title: 'The AI Tool That Writes Better Than Most Humans', views: 950000 },
    ],
  },
  {
    title: 'Personal Finance & Investing',
    category: 'finance',
    format: 'longform',
    heat: 91,
    rpmRange: '$12–$25',
    outliers: [
      { title: 'How I Make $10K/Month Passive Income (Step by Step)', views: 3100000 },
      { title: 'The Budgeting Method That Saved Me $30K in One Year', views: 2200000 },
      { title: 'Why Most Financial Advice Is Wrong (Data Proves It)', views: 1500000 },
    ],
  },
  {
    title: 'True Crime Unsolved',
    category: 'entertainment',
    format: 'longform',
    heat: 88,
    rpmRange: '$6–$14',
    outliers: [
      { title: 'The Case Nobody Can Explain — Disappeared Without a Trace', views: 4200000 },
      { title: 'Inside the Most Bizarre Cold Case in FBI History', views: 2800000 },
      { title: 'This Killer Was Never Caught — And the Clues Make No Sense', views: 1900000 },
    ],
  },
  {
    title: 'Business Case Studies',
    category: 'business',
    format: 'longform',
    heat: 76,
    rpmRange: '$10–$22',
    outliers: [
      { title: 'How This Company Went From $0 to $100M in 18 Months', views: 1700000 },
      { title: 'The Startup That Failed in 90 Days (Full Postmortem)', views: 1200000 },
      { title: 'Why This Business Model Is Collapsing Right Now', views: 890000 },
    ],
  },
  {
    title: 'Hidden History',
    category: 'history',
    format: 'longform',
    heat: 73,
    rpmRange: '$5–$11',
    outliers: [
      { title: 'The Event They Deleted From History Books', views: 3500000 },
      { title: 'Ancient Technology We Still Can\'t Replicate', views: 2100000 },
      { title: 'The Lie About Christopher Columbus Everyone Believes', views: 1400000 },
    ],
  },
  {
    title: 'Family Revenge Stories',
    category: 'drama',
    format: 'longform',
    heat: 85,
    rpmRange: '$4–$9',
    outliers: [
      { title: 'My Stepmother Stole My Inheritance — So I Took Everything Back', views: 5100000 },
      { title: 'The Family Secret That Destroyed 3 Generations', views: 3300000 },
      { title: 'I Found Out My Dad Had a Second Family (This Is What I Did)', views: 2600000 },
    ],
  },
  {
    title: 'Space & Cosmic Mysteries',
    category: 'science',
    format: 'longform',
    heat: 79,
    rpmRange: '$7–$16',
    outliers: [
      { title: 'What NASA Found on Europa Will Change Everything', views: 2900000 },
      { title: 'The Signal From Space That Nobody Can Explain', views: 1800000 },
      { title: 'Why Scientists Are Scared of What\'s Coming From Mars', views: 1300000 },
    ],
  },
  {
    title: 'Horror Stories That Feel Real',
    category: 'entertainment',
    format: 'longform',
    heat: 87,
    rpmRange: '$5–$12',
    outliers: [
      { title: 'The Most Disturbing Thing That Happened at 3AM', views: 4500000 },
      { title: 'True Story: The House That Wouldn\'t Let Us Leave', views: 2700000 },
      { title: 'I Work Night Shift — You Won\'t Believe What I Saw', views: 2000000 },
    ],
  },
]

interface RunResult {
  niche: string
  type: string
  run: number
  classification: 'quality_pass' | 'quality_fail' | 'infra_skip'
  issues: string[]
  latencyMs: number
  provider: string
  model: string
  totalAttempts: number
  error?: string
}

function parseArgs() {
  const args = process.argv.slice(2)
  const opts: { type?: string; runs?: number } = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) opts.type = args[++i]
    if (args[i] === '--runs' && args[i + 1]) opts.runs = parseInt(args[++i], 10)
  }
  return opts
}

function isInfraError(err: unknown): boolean {
  if (!err) return false
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return msg.includes('503') || msg.includes('502') || msg.includes('429')
    || msg.includes('overloaded') || msg.includes('unavailable')
    || msg.includes('transient') || msg.includes('timeout')
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  const cli = parseArgs()
  const provider = process.env.AI_PROVIDER ?? 'gemini'
  const model = process.env.GEMINI_MODEL ?? process.env.ANTHROPIC_MODEL ?? 'unknown'
  const filterType = cli.type as ('breakdown' | 'skeleton') | undefined
  const runsPerNiche = cli.runs ?? 3
  const types: Array<'breakdown' | 'skeleton'> = filterType ? [filterType] : ['breakdown', 'skeleton']
  const totalExpected = NICHES.length * runsPerNiche * types.length

  console.log(`\n🔥 NicheHeat Generation Harness`)
  console.log(`   Provider: ${provider} | Model: ${model}`)
  console.log(`   Niches: ${NICHES.length} | Runs/niche: ${runsPerNiche} | Types: ${types.join(',')}`)
  console.log(`   Total runs: ${totalExpected}\n`)

  const results: RunResult[] = []
  let totalRun = 0
  let infraCount = 0

  for (const niche of NICHES) {
    for (const type of types) {
      for (let run = 1; run <= runsPerNiche; run++) {
        totalRun++
        const label = `[${totalRun}/${totalExpected}] ${niche.title} / ${type} / run ${run}`
        process.stdout.write(`  ${label} ... `)

        try {
          const result = await runGeneration(type, niche, { targetMinutes: 12 })

          const validator = type === 'breakdown' ? validateBreakdown : validateSkeleton
          const issues = validator(result.payload)

          if (issues.length === 0) {
            results.push({
              niche: niche.title, type, run,
              classification: 'quality_pass',
              issues: [], latencyMs: result.latencyMs,
              provider: result.provider, model: result.model,
              totalAttempts: result.totalAttempts,
            })
            console.log(`✅ PASS (${result.latencyMs}ms, ${result.totalAttempts} attempts)`)
          } else {
            const hasBanned = issues.some(i => i.startsWith('banned phrase'))
            results.push({
              niche: niche.title, type, run,
              classification: 'quality_fail',
              issues, latencyMs: result.latencyMs,
              provider: result.provider, model: result.model,
              totalAttempts: result.totalAttempts,
            })
            console.log(`❌ FAIL (${issues.length} issues, ${result.latencyMs}ms)`)
            for (const issue of issues) console.log(`      → ${issue}`)
          }
        } catch (err: any) {
          const msg = err.message || String(err)
          const infra = isInfraError(err)
          if (infra) infraCount++
          results.push({
            niche: niche.title, type, run,
            classification: infra ? 'infra_skip' : 'quality_fail',
            issues: [], latencyMs: 0,
            provider, model, totalAttempts: 0,
            error: msg,
          })
          console.log(infra ? `⚠️ INFRA: ${msg.substring(0, 100)}` : `💥 ERROR: ${msg.substring(0, 100)}`)
        }

        if (totalRun < totalExpected) await sleep(1500)
      }
    }
  }

  const qualityResults = results.filter(r => r.classification !== 'infra_skip')
  const qualityPass = results.filter(r => r.classification === 'quality_pass').length
  const qualityFail = results.filter(r => r.classification === 'quality_fail').length
  const infraSkip = results.filter(r => r.classification === 'infra_skip').length
  const qualityRate = qualityResults.length > 0 ? Math.round((qualityPass / qualityResults.length) * 100) : 0

  let verdict: string
  if (qualityRate >= 90) verdict = '✅ PASS — Beta-ready'
  else if (qualityRate >= 75) verdict = '⚠️ WARN — Fix top issues before beta'
  else verdict = '❌ FAIL — Prompts need rewriting'

  console.log(`\n${'='.repeat(60)}`)
  console.log(`HARNESS VERDICT: ${verdict}`)
  console.log(`Quality pass: ${qualityPass}/${qualityResults.length} (${qualityRate}%)`)
  console.log(`Quality fail: ${qualityFail} | Infra skip: ${infraSkip}`)
  console.log(`${'='.repeat(60)}\n`)

  const bannedPhrases = results.filter(r => r.issues.some(i => i.startsWith('banned phrase')))
  console.log(`Banned phrase failures: ${bannedPhrases.length}`)

  const totalGenerations = results.filter(r => r.classification === 'quality_pass').length
  const totalAttemptsAll = results.reduce((s, r) => s + r.totalAttempts, 0)
  console.log(`Successful generations: ${totalGenerations} (spend proxy)`)
  console.log(`Total API calls (incl retries): ${totalAttemptsAll}`)

  if (infraSkip > totalExpected * 0.3) {
    console.log(`\n⚠️  INFRA OUTAGE: ${infraSkip}/${totalExpected} runs failed on transient errors.`)
    console.log(`    Gemini may be overloaded. Retry later.\n`)
  }

  const byNiche: Record<string, { pass: number; fail: number; infra: number }> = {}
  for (const r of results) {
    if (!byNiche[r.niche]) byNiche[r.niche] = { pass: 0, fail: 0, infra: 0 }
    if (r.classification === 'quality_pass') byNiche[r.niche].pass++
    else if (r.classification === 'quality_fail') byNiche[r.niche].fail++
    else byNiche[r.niche].infra++
  }
  console.log('Per-Niche:')
  for (const [niche, s] of Object.entries(byNiche)) {
    const total = s.pass + s.fail
    const pct = total > 0 ? Math.round((s.pass / total) * 100) : 0
    console.log(`  ${pct >= 90 ? '✅' : pct >= 75 ? '⚠️' : '❌'} ${niche}: ${s.pass}/${total} quality (${s.infra} infra)`)
  }

  const failures = results.filter(r => r.classification === 'quality_fail')
  if (failures.length > 0) {
    console.log('\nQuality Failures:')
    for (const f of failures) {
      console.log(`\n  [${f.niche} / ${f.type} / run ${f.run}]`)
      if (f.error) console.log(`    Error: ${f.error}`)
      for (const issue of f.issues) console.log(`    Issue: ${issue}`)
    }
  }

  const reportDir = join(process.cwd(), 'harness-reports')
  mkdirSync(reportDir, { recursive: true })
  const reportPath = join(reportDir, `harness-${new Date().toISOString().slice(0, 10)}.json`)
  writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    provider, model,
    config: { niches: NICHES.length, runsPerNiche, types, totalRuns: totalExpected },
    quality: { pass: qualityPass, fail: qualityFail, infraSkip, rate: qualityRate, verdict },
    bannedPhraseFailures: bannedPhrases.length,
    totalGenerations, totalAttemptsAll,
    runs: results,
  }, null, 2))
  console.log(`\nReport: ${reportPath}`)
}

main().catch((err) => {
  console.error('Harness failed:', err)
  process.exit(1)
})
