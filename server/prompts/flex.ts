import type { NicheProfile } from '../utils/nicheProfiles'

const BANNED_OPENERS = `
FINAL HARD RULE — the output must NOT contain anywhere: "in today's video", "in this video",
"smash that like", "like and subscribe", "without further ado", "welcome back to", "let's dive in".
If you were about to write one, rewrite that line.`

const BREAKDOWN_CONTRACT = `
OUTPUT CONTRACT — JSON object with exactly these keys:
{
  "why_it_works": string,            // 2-3 sentences, mechanism-level, no fluff
  "narrative_mechanics": string[],   // 3-5 observed mechanics in the outlier titles/format
  "hook_patterns": string[],         // 3 reusable hook formulas. CRITICAL: each MUST contain a {placeholder} like {topic}, {number}, {person}, {timeframe} — e.g. "I tried {topic} for 30 days and {result}". No {placeholder} = invalid.
  "audience_psychology": string,     // 1-2 sentences: the emotional itch being scratched
  "saturation_risk": { "level": "low"|"medium"|"high", "reasoning": string, "window_estimate": string },
  "entry_angle": string,             // the differentiated angle a NEW channel should take
  "red_flags": string[]              // 1-3 honest warnings (can be empty array if none)
}`

export function nicheBreakdownPrompt(niche: {
  title: string
  category: string
  format: 'longform' | 'shorts'
  outliers: Array<{ title: string; views: number; channelAgeDays?: number }>
  heat: number
  rpmRange: string
}) {
  const system = `You are a YouTube strategy analyst specializing in faceless channels.
You analyze niches with the rigor of an investor memo: mechanisms, not platitudes.
You respond with ONLY a valid JSON object. No markdown fences, no preamble.`

  const user = `Analyze this niche for a faceless-channel operator deciding whether to enter.

NICHE: ${niche.title} (category: ${niche.category}, format: ${niche.format})
HEAT: ${niche.heat} | RPM estimate: ${niche.rpmRange}
TOP OUTLIER VIDEOS:
${niche.outliers.map((o, i) => `${i + 1}. "${o.title}" — ${o.views.toLocaleString()} views${o.channelAgeDays ? `, channel age ${Math.round(o.channelAgeDays / 30)}mo` : ''}`).join('\n')}
${BREAKDOWN_CONTRACT}
${BANNED_OPENERS}`

  return { system, user }
}

export function scriptSkeletonPrompt(input: {
  nicheTitle: string
  format: 'longform' | 'shorts'
  targetMinutes: number
  entryAngle?: string
  hookPattern?: string
  profile?: NicheProfile
  topOutliers?: Array<{ title: string; views: number }>
}) {
  const profile = input.profile

  const systemParts = [
    `You are a script architect for faceless YouTube channels.`,
    `You produce skeletons (structure + beats), not full scripts: the operator's`,
    `writer or pipeline fills in prose. Quality bar: a skeleton is good only if two`,
    `skeletons for the same niche are structurally distinct.`,
  ]

  if (profile) {
    systemParts.push(`\nNICHE PROFILE — ${profile.slug.toUpperCase()} (${profile.structureClass.toUpperCase()} structure)`)
    systemParts.push(`THEME: ${profile.protagonist}`)
    systemParts.push(`ANTAGONIST: ${profile.antagonist}`)
    systemParts.push(`SETTING: ${profile.setting}`)
    systemParts.push(`EMOTIONAL ENGINE: ${profile.emotionalEngine}`)
    systemParts.push(`VISUAL SIGNATURE: ${profile.visualSignature}`)
    systemParts.push(`ART LOCK — required: ${profile.artLock.required.join('; ')} | BANNED: ${profile.artLock.banned.join(', ')}`)
    systemParts.push(`ENDING/CTA: ${profile.endingCta}`)
    systemParts.push(`\nARC STRUCTURE (${profile.structureClass.toUpperCase()}) — you MUST follow this act progression:`)
    for (const act of profile.arc) {
      systemParts.push(`  Act ${act.n}: "${act.label}" (${act.startPct}–${act.endPct}%) — ${act.purpose}`)
    }
    systemParts.push(`\nCENTRAL ENGINE: the ${profile.centralEngineLabel} — plant it early, pay it off late.`)
    systemParts.push(`ESCALATION: ${profile.escalationLabel} — minimum 2 rungs, each answering a prior setback.`)
    systemParts.push(`\n${profile.antiBanBlock}`)
  } else {
    systemParts.push(`\nNARRATIVE MECHANICS (use these, never name them in output text):
1. HOOK-LOOP — the opening line raises a concrete, specific question that is
   only fully answered in the final act. Every act ends by tightening that
   question, not resolving it.
2. WITHHELD CENTRAL ENGINE — one tangible object/fact is referenced early,
   shown partially through the middle, fully revealed late. The engine must
   recontextualize earlier scenes when revealed.
3. RECONTEXTUALIZING REVEAL — the act-3 reveal must change the meaning of at
   least two earlier scenes (mark which ones).
4. ESCALATION LADDER — the protagonist's response comes in escalating rungs
   (minimum 2), each rung answering a prior setback beat-for-beat.
${profile?.antiBanBlock ?? ''}`)
  }

  systemParts.push(`\nYou respond with ONLY a valid JSON object. No markdown fences, no preamble.`)

  const nicheLine = `NICHE: ${input.nicheTitle}`
  const formatLine = `FORMAT: ${input.format}, target length ~${input.targetMinutes} min`
  const lengthLine = profile ? `LENGTH: ${profile.lengthMin}–${profile.lengthMax} min (~${profile.narrationWordsMin}–${profile.narrationWordsMax} words)` : ''
  const entryLine = input.entryAngle ? `ENTRY ANGLE: ${input.entryAngle}` : ''
  const hookLine = input.hookPattern ? `PREFERRED HOOK PATTERN: ${input.hookPattern}` : ''

  let outlierSection = ''
  if (input.topOutliers?.length) {
    outlierSection = `\nPROVEN OUTLIER PATTERNS (learn from these titles):` +
      input.topOutliers.map((o, i) => `\n  ${i + 1}. "${o.title}" — ${o.views.toLocaleString()} views`).join('')
  }

  const contract = `
OUTPUT CONTRACT — JSON object with exactly these keys:
{
  "title_options": string[],          // 3 titles, outlier-style, no clickbait words banned by advertisers
  "hook": { "spoken_line": string, "visual_note": string, "open_question": string },
  "central_engine": { "what": string, "planted_in_act": number, "paid_off_in_act": number },
  "acts": [                           // ${profile ? profile.arc.length : '3-5'} acts following the profile arc
    {
      "n": number,
      "label": string,
      "start_pct": number, "end_pct": number,
      "beats": string[],              // 3-6 beats; each beat <= 20 words, with one concrete detail
      "loop_tightener": string        // how this act sharpens the open question
    }
  ],
  "reveal": { "what_changes": string, "recontextualizes_scenes": number[] },
  "escalation_ladder": [ { "rung": number, "beat": string, "raises_stakes": string } ],
  "narrator_asides": [ { "act": number, "note": string } ],
  "cta": string,                      // soft, in-world CTA, never "like and subscribe" verbatim
  "authenticity_checklist": string[]  // 3-5 self-checks this skeleton already satisfies
}`

  const user = [
    `Build a script skeleton.`,
    '',
    nicheLine,
    formatLine,
    lengthLine,
    entryLine,
    hookLine,
    outlierSection,
    '',
    contract,
    '',
    BANNED_OPENERS,
  ].filter(Boolean).join('\n')

  return { system: systemParts.join('\n'), user }
}

export function scriptPrompt(input: {
  skeleton: Record<string, unknown>
  profile?: NicheProfile
}) {
  const profile = input.profile
  const skeleton = input.skeleton

  const systemParts = [
    `You are a scriptwriter for faceless YouTube channels.`,
    `You receive an approved skeleton (structure + beats) and produce a full`,
    `narrative voice-over script. The script must follow the skeleton's acts,`,
    `beats, central engine, and escalation ladder precisely.`,
    `Write in flowing, natural narration — like a skilled storyteller speaking`,
    `directly to the viewer. Include [NARRATOR ASIDE] markers where the skeleton`,
    `calls for human markers.`,
  ]

  if (profile) {
    systemParts.push(`\nNICHE PROFILE — ${profile.slug.toUpperCase()} (${profile.structureClass.toUpperCase()})`)
    systemParts.push(`LENGTH: ${profile.narrationWordsMin}–${profile.narrationWordsMax} words`)
    systemParts.push(`LANGUAGE: ${profile.language}`)
    systemParts.push(`EMOTIONAL ENGINE: ${profile.emotionalEngine}`)
    systemParts.push(`ART LOCK: ${profile.artLock.required.join('; ')}`)
    systemParts.push(`\n${profile.antiBanBlock}`)
  }

  systemParts.push(`\nYou respond with ONLY a valid JSON object. No markdown fences, no preamble.`)

  const contract = `
OUTPUT CONTRACT — JSON object with exactly these keys:
{
  "title": string,                      // best of the skeleton's title_options
  "script_markdown": string,            // full voice-over script in markdown with act headers (## Act N: Label)
  "word_count": number,                 // exact word count of the script
  "section_headers": string[],          // ["Act 1: Hook + Loop", "Act 2: Setup", ...]
  "hook_line": string,                  // the opening spoken line
  "cta_line": string                    // the closing CTA line
}`

  const user = [
    `Write a full voice-over script from this skeleton.`,
    '',
    `SKELETON:`,
    JSON.stringify(skeleton, null, 2),
    '',
    contract,
    '',
    `HARD RULES:`,
    `- Script must be ${profile ? `${profile.narrationWordsMin}–${profile.narrationWordsMax} words` : '1500–3200 words'}.`,
    `- Follow the skeleton's acts, beats, and timing exactly.`,
    `- Never narrate real posts verbatim — invent all names, places, specifics.`,
    `- Include [NARRATOR ASIDE] markers at the positions noted in the skeleton.`,
    `- Script must NOT contain: "in today's video", "in this video", "smash that like", "like and subscribe", "without further ado", "welcome back to", "let's dive in".`,
  ].join('\n')

  return { system: systemParts.join('\n'), user }
}
