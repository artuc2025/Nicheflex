export type StructureClass = 'drama' | 'documentary'

export interface ArcAct {
  n: number
  label: string
  purpose: string
  startPct: number
  endPct: number
}

export interface NicheProfile {
  slug: string
  structureClass: StructureClass
  language: string
  lengthMin: number
  lengthMax: number
  narrationWordsMin: number
  narrationWordsMax: number
  protagonist: string
  antagonist: string
  setting: string
  artLock: { required: string[]; banned: string[] }
  emotionalEngine: string
  visualSignature: string
  endingCta: string
  arc: ArcAct[]
  centralEngineLabel: string
  escalationLabel: string
  antiBanBlock: string
}

export const NICHE_PROFILES: Record<string, NicheProfile> = {
  'family-drama': {
    slug: 'family-drama',
    structureClass: 'drama',
    language: 'English',
    lengthMin: 9,
    lengthMax: 15,
    narrationWordsMin: 1500,
    narrationWordsMax: 2300,
    protagonist: 'First-person wronged narrator (faceless voice)',
    antagonist: 'Entitled family member (MIL / parent / sibling / in-law) — per script',
    setting: 'Contemporary domestic realism — homes, gatherings, weddings, funerals, workplaces',
    artLock: {
      required: ['cinematic realistic', 'natural lighting', 'shallow depth of field', 'contemporary domestic setting', 'emotional documentary tone'],
      banned: ['cartoon', 'anime', 'Pixar', 'stylized 3D'],
    },
    emotionalEngine: 'injustice → simmering anger → anticipation → vindication → catharsis',
    visualSignature: 'warm-to-cold contrast; tension cool/desaturated, payoff warm',
    endingCta: 'comeuppance + 1-line moral + soft CTA + tease next story',
    centralEngineLabel: 'withheld mystery object',
    escalationLabel: 'counterattack waves',
    arc: [
      { n: 1, label: 'Hook + Loop', purpose: 'Open in the shock moment, end on a withheld mystery object', startPct: 0, endPct: 8 },
      { n: 2, label: 'Setup', purpose: 'Establish the relationship, the normal, the first slight', startPct: 8, endPct: 25 },
      { n: 3, label: 'Escalation Ladder', purpose: '4-6 escalating sabotages, false-relief re-hook', startPct: 25, endPct: 55 },
      { n: 4, label: 'Turn + Reveal', purpose: 'Ally quietly prepared the weapon; recontextualises earlier slights; narrator stays clean', startPct: 55, endPct: 75 },
      { n: 5, label: 'Counterattack Waves + Collapse', purpose: 'Antagonist strikes back in escalating waves, each defeated & converted to evidence; tiered comeuppance', startPct: 75, endPct: 100 },
    ],
    antiBanBlock: `ANTI-BAN AUTHENTICITY LAYER (YouTube 2026 mass-produced-AI enforcement):
- ORIGINALITY: never narrate a real Reddit/forum/news post verbatim or near-verbatim. Invent names, city, specifics, structure. Inspiration ≠ transcription.
- VARIATION: structure timings must differ from the "default" template — shift act boundaries by ±10-20% from equal thirds; vary sentence rhythm.
- SPECIFICITY: every scene needs at least one concrete sensory or numeric detail (a sum of money, a street name, a smell, an exact time).
- HUMAN MARKERS: include 2-3 spots marked [NARRATOR ASIDE] where a personal, slightly imperfect aside should be voiced (hesitation, dry humor).
- VISUAL EFFORT: motion (b-roll, pan/zoom, jump cuts, overlays), never static slideshows.
- DISCLOSURE & SAFETY: advertiser-friendly; no gratuitous violence, no real named private individuals, no defamation. Toggle synthetic-content disclosure where required.
- TITLE/THUMBNAIL HONESTY: dramatic but true to the content.
- NEVER produce: "In today's video", "Without further ado", "smash that like button" openers, or any meta-reference to the video itself before minute 1.`,
  },

  'true-crime': {
    slug: 'true-crime',
    structureClass: 'drama',
    language: 'English',
    lengthMin: 10,
    lengthMax: 18,
    narrationWordsMin: 1700,
    narrationWordsMax: 2800,
    protagonist: 'Narrator-investigator (faceless); the victim as emotional anchor',
    antagonist: 'The perpetrator / the unknown (the case itself is the adversary)',
    setting: 'Real-world realism — towns, last-known locations, case timelines',
    artLock: {
      required: ['cinematic realistic', 'desaturated cool grade', 'investigative documentary tone', 'archival-photo feel', 'dramatic low light'],
      banned: ['cartoon', 'anime', 'Pixar', 'stylized 3D', 'gore'],
    },
    emotionalEngine: 'unease → curiosity → mounting dread → revelation → sober closure',
    visualSignature: 'cold blues/greys; the "evidence" frame recurs; warm only in victim memory',
    endingCta: 'the answer (or the haunting non-answer) + reflection + soft CTA + next case tease',
    centralEngineLabel: 'the key piece of evidence',
    escalationLabel: 'escalating leads and dead-ends',
    arc: [
      { n: 1, label: 'Hook + Withheld', purpose: 'Open on the most chilling detail; pose the case question; withhold', startPct: 0, endPct: 10 },
      { n: 2, label: 'Victim & Normal', purpose: 'Humanise the victim, establish the ordinary before', startPct: 10, endPct: 28 },
      { n: 3, label: 'Investigation Escalation', purpose: 'Clues/leads ladder, each deepening the mystery; false-lead re-hook', startPct: 28, endPct: 58 },
      { n: 4, label: 'Turn + Reveal', purpose: 'The discovery/theory that recontextualises earlier details', startPct: 58, endPct: 78 },
      { n: 5, label: 'Aftermath', purpose: 'Consequences, the lingering question, justice-or-not', startPct: 78, endPct: 100 },
    ],
    antiBanBlock: `ANTI-BAN AUTHENTICITY LAYER (YouTube 2026 mass-produced-AI enforcement):
- ORIGINALITY: never narrate a real Reddit/forum/news post verbatim or near-verbatim. Invent names, city, specifics, structure. Inspiration ≠ transcription.
- VARIATION: structure timings must differ from the "default" template — shift act boundaries by ±10-20% from equal thirds; vary sentence rhythm.
- SPECIFICITY: every scene needs at least one concrete sensory or numeric detail (a sum of money, a street name, a smell, an exact time).
- HUMAN MARKERS: include 2-3 spots marked [NARRATOR ASIDE] where a personal, slightly imperfect aside should be voiced (hesitation, dry humor).
- VISUAL EFFORT: motion (b-roll, pan/zoom, jump cuts, overlays), never static slideshows.
- DISCLOSURE & SAFETY: advertiser-friendly; no gratuitous violence, no real named private individuals, no defamation. Toggle synthetic-content disclosure where required. No gore.
- TITLE/THUMBNAIL HONESTY: dramatic but true to the content.
- NEVER produce: "In today's video", "Without further ado", "smash that like button" openers, or any meta-reference to the video itself before minute 1.`,
  },

  'business-stories': {
    slug: 'business-stories',
    structureClass: 'drama',
    language: 'English',
    lengthMin: 10,
    lengthMax: 16,
    narrationWordsMin: 1700,
    narrationWordsMax: 2500,
    protagonist: 'Narrator-analyst; sometimes a whistleblower/founder as anchor',
    antagonist: 'The hubris — greedy exec, fraudulent company, doomed strategy',
    setting: 'Corporate realism — offices, boardrooms, factories, headlines, charts',
    artLock: {
      required: ['cinematic realistic', 'clean corporate palette', 'documentary tone', 'archival/news feel'],
      banned: ['cartoon', 'anime', 'Pixar', 'stylized 3D'],
    },
    emotionalEngine: 'intrigue → ambition → tension → reckoning → lesson',
    visualSignature: 'polished-then-cracking; sleek visuals decay as the collapse nears',
    endingCta: 'the fall + the takeaway lesson + soft CTA + next case tease',
    centralEngineLabel: 'the fatal flaw or document',
    escalationLabel: 'escalating cover-ups',
    arc: [
      { n: 1, label: 'Hook + Withheld', purpose: 'Open on the staggering number/headline of the collapse; pose "how did it get here?"; withhold', startPct: 0, endPct: 10 },
      { n: 2, label: 'The Empire', purpose: 'The rise, the apparent success', startPct: 10, endPct: 30 },
      { n: 3, label: 'The Cracks', purpose: 'Escalating warning signs ignored; false-confidence re-hook', startPct: 30, endPct: 58 },
      { n: 4, label: 'Turn + Reveal', purpose: 'The rot/fraud exposed; recontextualises earlier "wins"', startPct: 58, endPct: 78 },
      { n: 5, label: 'Collapse + Lesson', purpose: 'Tiered fall; the human cost; the lesson', startPct: 78, endPct: 100 },
    ],
    antiBanBlock: `ANTI-BAN AUTHENTICITY LAYER (YouTube 2026 mass-produced-AI enforcement):
- ORIGINALITY: never narrate a real Reddit/forum/news post verbatim or near-verbatim. Invent names, city, specifics, structure. Inspiration ≠ transcription.
- VARIATION: structure timings must differ from the "default" template — shift act boundaries by ±10-20% from equal thirds; vary sentence rhythm.
- SPECIFICITY: every scene needs at least one concrete sensory or numeric detail (a sum of money, a street name, a smell, an exact time).
- HUMAN MARKERS: include 2-3 spots marked [NARRATOR ASIDE] where a personal, slightly imperfect aside should be voiced (hesitation, dry humor).
- VISUAL EFFORT: motion (b-roll, pan/zoom, jump cuts, overlays), never static slideshows.
- DISCLOSURE & SAFETY: advertiser-friendly; no gratuitous violence, no real named private individuals, no defamation. Toggle synthetic-content disclosure where required.
- TITLE/THUMBNAIL HONESTY: dramatic but true to the content.
- NEVER produce: "In today's video", "Without further ado", "smash that like button" openers, or any meta-reference to the video itself before minute 1.`,
  },

  'history': {
    slug: 'history',
    structureClass: 'documentary',
    language: 'English',
    lengthMin: 12,
    lengthMax: 20,
    narrationWordsMin: 2000,
    narrationWordsMax: 3200,
    protagonist: 'Authoritative-but-curious documentary voice (faceless)',
    antagonist: 'N/A — the withheld historical question is the adversary',
    setting: 'Period realism — locations, artefacts, maps, recreations',
    artLock: {
      required: ['cinematic realistic', 'period-accurate', 'museum/archival tone', 'painterly-realistic light'],
      banned: ['cartoon', 'anime', 'Pixar', 'stylized 3D', 'anachronisms'],
    },
    emotionalEngine: 'curiosity → growing stakes → tension → revelation → reflection',
    visualSignature: 'warm aged tones; cold at the moment of consequence',
    endingCta: 'the legacy/what-it-means + lingering thought + soft CTA + next topic tease',
    centralEngineLabel: 'the withheld historical question',
    escalationLabel: 'deepening forces and layers',
    arc: [
      { n: 1, label: 'Hook + Central Question', purpose: 'Open on the startling fact/moment; pose the withheld question "how/why did this happen?"', startPct: 0, endPct: 10 },
      { n: 2, label: 'Context', purpose: 'The world before, the stakes', startPct: 10, endPct: 28 },
      { n: 3, label: 'Deepening', purpose: 'Escalating layers/forces that raise the question, each re-hooking', startPct: 28, endPct: 58 },
      { n: 4, label: 'Revelation / Turn', purpose: 'The cause/truth that recontextualises the earlier beats', startPct: 58, endPct: 80 },
      { n: 5, label: 'Consequence & Legacy', purpose: 'What it changed, the reflection', startPct: 80, endPct: 100 },
    ],
    antiBanBlock: `ANTI-BAN AUTHENTICITY LAYER (YouTube 2026 mass-produced-AI enforcement):
- ORIGINALITY: never narrate a real Reddit/forum/news post verbatim or near-verbatim. Invent names, city, specifics, structure. Inspiration ≠ transcription.
- VARIATION: structure timings must differ from the "default" template — shift act boundaries by ±10-20% from equal thirds; vary sentence rhythm.
- SPECIFICITY: every scene needs at least one concrete sensory or numeric detail (a sum of money, a street name, a smell, an exact time).
- HUMAN MARKERS: include 2-3 spots marked [NARRATOR ASIDE] where a personal, slightly imperfect aside should be voiced (hesitation, dry humor).
- VISUAL EFFORT: motion (b-roll, pan/zoom, jump cuts, overlays), never static slideshows.
- DISCLOSURE & SAFETY: advertiser-friendly; no gratuitous violence, no real named private individuals, no defamation. No anachronisms.
- TITLE/THUMBNAIL HONESTY: dramatic but true to the content.
- NEVER produce: "In today's video", "Without further ado", "smash that like button" openers, or any meta-reference to the video itself before minute 1.`,
  },

  'space-science': {
    slug: 'space-science',
    structureClass: 'documentary',
    language: 'English',
    lengthMin: 12,
    lengthMax: 20,
    narrationWordsMin: 2000,
    narrationWordsMax: 3200,
    protagonist: 'Wonder-driven, precise documentary voice (faceless)',
    antagonist: 'N/A — the withheld scientific question is the adversary',
    setting: 'Cosmic realism — space, telescopes, data, scientific recreations',
    artLock: {
      required: ['cinematic realistic', 'NASA/observatory tone', 'deep-space lighting', 'scientific-accurate'],
      banned: ['cartoon', 'anime', 'Pixar', 'stylized 3D', 'fantasy/sci-fi kitsch'],
    },
    emotionalEngine: 'wonder → curiosity → tension → awe → contemplation',
    visualSignature: 'deep blacks + luminous accents; scale-emphasising compositions',
    endingCta: 'the implication / what it means for us + lingering awe + soft CTA + next topic tease',
    centralEngineLabel: 'the withheld scientific question',
    escalationLabel: 'deepening anomalies',
    arc: [
      { n: 1, label: 'Hook + Central Question', purpose: 'Open on the staggering phenomenon; pose "what is it / how can this be?"; withhold', startPct: 0, endPct: 10 },
      { n: 2, label: 'The Known', purpose: 'Current understanding, the setup', startPct: 10, endPct: 28 },
      { n: 3, label: 'The Deepening', purpose: 'Anomalies/escalating mystery that raise the question', startPct: 28, endPct: 58 },
      { n: 4, label: 'The Discovery / Explanation', purpose: 'The answer or leading theory that recontextualises', startPct: 58, endPct: 80 },
      { n: 5, label: 'The Implication', purpose: 'What it means, the wonder', startPct: 80, endPct: 100 },
    ],
    antiBanBlock: `ANTI-BAN AUTHENTICITY LAYER (YouTube 2026 mass-produced-AI enforcement):
- ORIGINALITY: never narrate a real Reddit/forum/news post verbatim or near-verbatim. Invent names, city, specifics, structure. Inspiration ≠ transcription.
- VARIATION: structure timings must differ from the "default" template — shift act boundaries by ±10-20% from equal thirds; vary sentence rhythm.
- SPECIFICITY: every scene needs at least one concrete sensory or numeric detail (a sum of money, a street name, a smell, an exact time).
- HUMAN MARKERS: include 2-3 spots marked [NARRATOR ASIDE] where a personal, slightly imperfect aside should be voiced (hesitation, dry humor).
- VISUAL EFFORT: motion (b-roll, pan/zoom, jump cuts, overlays), never static slideshows.
- DISCLOSURE & SAFETY: advertiser-friendly; no gratuitous violence, no real named private individuals, no defamation. No fantasy/sci-fi kitsch.
- TITLE/THUMBNAIL HONESTY: dramatic but true to the content.
- NEVER produce: "In today's video", "Without further ado", "smash that like button" openers, or any meta-reference to the video itself before minute 1.`,
  },
}

export function getProfile(slug: string): NicheProfile | undefined {
  return NICHE_PROFILES[slug]
}

export function getSlugFromTitle(title: string): string | undefined {
  const map: Record<string, string> = {
    'family drama': 'family-drama',
    'true crime': 'true-crime',
    'business stories': 'business-stories',
    'business': 'business-stories',
    'history': 'history',
    'hidden history': 'history',
    'space science': 'space-science',
    'space': 'space-science',
    'space & cosmic mysteries': 'space-science',
  }
  const lower = title.toLowerCase()
  for (const [key, slug] of Object.entries(map)) {
    if (lower.includes(key)) return slug
  }
  return undefined
}
