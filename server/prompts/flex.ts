// server/prompts/flex.ts
// Production prompts for the two core generations.
// Encodes FLEX ENGINE mechanics: hook-loop, withheld mystery object,
// recontextualizing reveal, counterattack waves + anti-ban authenticity layer.
//
// >>> MERGE POINT: if your flex-bridge.md / flex-longform-addon.md contain
// >>> richer mechanic definitions, paste them into MECHANICS_BLOCK below.
// >>> Keep the OUTPUT CONTRACT sections untouched — the test harness
// >>> and the validators both depend on these exact JSON shapes.

const MECHANICS_BLOCK = `
NARRATIVE MECHANICS (use these, never name them in output text):
1. HOOK-LOOP — the opening line raises a concrete, specific question that is
   only fully answered in the final act. Every act ends by tightening that
   question, not resolving it.
2. WITHHELD MYSTERY OBJECT — one tangible object/fact is referenced early,
   shown partially through the middle, fully revealed late. The object must
   recontextualize earlier scenes when revealed.
3. RECONTEXTUALIZING REVEAL — the act-3 reveal must change the meaning of at
   least two earlier scenes (mark which ones).
4. COUNTERATTACK WAVES — the protagonist's response comes in escalating waves
   (minimum 2), each wave answering a prior humiliation/setback beat-for-beat.

ANTI-BAN AUTHENTICITY LAYER (YouTube 2026 mass-produced-AI enforcement):
- VARIATION: structure timings must differ from the "default" template —
  shift act boundaries by ±10-20% from equal thirds; vary sentence rhythm.
- SPECIFICITY: every scene needs at least one concrete sensory or numeric
  detail (a sum of money, a street name, a smell, an exact time).
- HUMAN MARKERS: include 2-3 spots marked [NARRATOR ASIDE] where a personal,
  slightly imperfect aside should be voiced (hesitation, dry humor).
- NEVER produce: "In today's video", "Without further ado", "smash that like
  button" openers, or any meta-reference to the video itself before minute 1.
`

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
${MECHANICS_BLOCK}
You respond with ONLY a valid JSON object. No markdown fences, no preamble.`

  const user = `Analyze this niche for a faceless-channel operator deciding whether to enter.

NICHE: ${niche.title} (category: ${niche.category}, format: ${niche.format})
HEAT: ${niche.heat} | RPM estimate: ${niche.rpmRange}
TOP OUTLIER VIDEOS:
${niche.outliers.map((o, i) => `${i + 1}. "${o.title}" — ${o.views.toLocaleString()} views${o.channelAgeDays ? `, channel age ${Math.round(o.channelAgeDays / 30)}mo` : ''}`).join('\n')}

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

  return { system, user }
}

export function scriptSkeletonPrompt(input: {
  nicheTitle: string
  format: 'longform' | 'shorts'
  targetMinutes: number
  entryAngle?: string
  hookPattern?: string
}) {
  const system = `You are a script architect for faceless YouTube channels.
You produce skeletons (structure + beats), not full scripts: the operator's
writer or pipeline fills in prose. Quality bar: a skeleton is good only if two
skeletons for the same niche are structurally distinct.
${MECHANICS_BLOCK}
You respond with ONLY a valid JSON object. No markdown fences, no preamble.`

  const user = `Build a script skeleton.

NICHE: ${input.nicheTitle}
FORMAT: ${input.format}, target length ~${input.targetMinutes} min
${input.entryAngle ? `ENTRY ANGLE: ${input.entryAngle}` : ''}
${input.hookPattern ? `PREFERRED HOOK PATTERN: ${input.hookPattern}` : ''}

OUTPUT CONTRACT — JSON object with exactly these keys:
{
  "title_options": string[],          // 3 titles, outlier-style, no clickbait words banned by advertisers
  "hook": { "spoken_line": string, "visual_note": string, "open_question": string },
  "mystery_object": { "what": string, "first_mention_act": number, "reveal_act": number },
  "acts": [                           // 3-5 acts; timings must NOT be equal thirds
    {
      "n": number,
      "label": string,
      "start_pct": number, "end_pct": number,
      "beats": string[],              // 3-6 beats; each beat <= 20 words, with one concrete detail
      "loop_tightener": string        // how this act sharpens the open question
    }
  ],
  "reveal": { "what_changes": string, "recontextualizes_scenes": number[] },
  "counterattack_waves": [ { "wave": number, "answers_setback": string, "action": string } ],
  "narrator_asides": [ { "act": number, "note": string } ],   // 2-3 human-marker spots
  "cta": string,                      // soft, in-world CTA, never "like and subscribe" verbatim
  "authenticity_checklist": string[]  // 3-5 self-checks this skeleton already satisfies
}

FINAL HARD RULE — the output must NOT contain anywhere: "in today's video", "in this video", "smash that like", "like and subscribe", "without further ado", "welcome back to", "let's dive in". If you were about to write one, rewrite that line.`

  return { system, user }
}
