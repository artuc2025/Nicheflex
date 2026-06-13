export type ValidationIssues = string[]

export function validateBreakdown(p: unknown): ValidationIssues {
  const issues: ValidationIssues = []
  if (!p || typeof p !== 'object') return ['Payload is not an object']
  const o = p as Record<string, unknown>

  if (typeof o.why_it_works !== 'string' || !o.why_it_works.trim()) {
    issues.push('why_it_works must be a non-empty string')
  }

  if (!Array.isArray(o.narrative_mechanics) || o.narrative_mechanics.length < 3) {
    issues.push('narrative_mechanics must be a string[] with at least 3 items')
  } else if (!o.narrative_mechanics.every((m: unknown) => typeof m === 'string' && m.trim())) {
    issues.push('narrative_mechanics items must be non-empty strings')
  }

  if (!Array.isArray(o.hook_patterns) || o.hook_patterns.length < 3) {
    issues.push('hook_patterns must be a string[] with at least 3 items')
  } else {
    o.hook_patterns.forEach((h: unknown, i: number) => {
      if (typeof h !== 'string') {
        issues.push(`hook_patterns[${i}] must be a string`)
      } else if (!/\{[^}]+\}/.test(h)) {
        issues.push(`hook_patterns[${i}] must contain a {placeholder}: "${h}"`)
      }
    })
  }

  if (typeof o.audience_psychology !== 'string' || !o.audience_psychology.trim()) {
    issues.push('audience_psychology must be a non-empty string')
  }

  if (!o.saturation_risk || typeof o.saturation_risk !== 'object') {
    issues.push('saturation_risk must be an object')
  } else {
    const sr = o.saturation_risk as Record<string, unknown>
    if (!['low', 'medium', 'high'].includes(sr.level as string)) {
      issues.push('saturation_risk.level must be low, medium, or high')
    }
    if (typeof sr.reasoning !== 'string' || !sr.reasoning.trim()) {
      issues.push('saturation_risk.reasoning must be a non-empty string')
    }
    if (typeof sr.window_estimate !== 'string' || !sr.window_estimate.trim()) {
      issues.push('saturation_risk.window_estimate must be a non-empty string')
    }
  }

  if (typeof o.entry_angle !== 'string' || !o.entry_angle.trim()) {
    issues.push('entry_angle must be a non-empty string')
  }

  if (!Array.isArray(o.red_flags)) {
    issues.push('red_flags must be a string[]')
  }

  return issues
}

export function validateSkeleton(p: unknown): ValidationIssues {
  const issues: ValidationIssues = []
  if (!p || typeof p !== 'object') return ['Payload is not an object']
  const o = p as Record<string, unknown>

  if (!Array.isArray(o.title_options) || o.title_options.length < 3) {
    issues.push('title_options must be a string[] with at least 3 items')
  } else if (!o.title_options.every((t: unknown) => typeof t === 'string' && t.trim())) {
    issues.push('title_options items must be non-empty strings')
  }

  if (!o.hook || typeof o.hook !== 'object') {
    issues.push('hook must be an object')
  } else {
    const h = o.hook as Record<string, unknown>
    for (const key of ['spoken_line', 'visual_note', 'open_question']) {
      if (typeof h[key] !== 'string' || !(h[key] as string).trim()) {
        issues.push(`hook.${key} must be a non-empty string`)
      }
    }
  }

  if (!o.mystery_object || typeof o.mystery_object !== 'object') {
    issues.push('mystery_object must be an object')
  } else {
    const mo = o.mystery_object as Record<string, unknown>
    if (typeof mo.what !== 'string' || !mo.what.trim()) {
      issues.push('mystery_object.what must be a non-empty string')
    }
    if (typeof mo.first_mention_act !== 'number') {
      issues.push('mystery_object.first_mention_act must be a number')
    }
    if (typeof mo.reveal_act !== 'number') {
      issues.push('mystery_object.reveal_act must be a number')
    }
  }

  if (!Array.isArray(o.acts) || o.acts.length < 3) {
    issues.push('acts must be an array with at least 3 items')
  } else {
    o.acts.forEach((a: unknown, i: number) => {
      if (!a || typeof a !== 'object') {
        issues.push(`acts[${i}] must be an object`)
        return
      }
      const act = a as Record<string, unknown>
      if (typeof act.n !== 'number') issues.push(`acts[${i}].n must be a number`)
      if (typeof act.label !== 'string') issues.push(`acts[${i}].label must be a string`)
      if (typeof act.start_pct !== 'number') issues.push(`acts[${i}].start_pct must be a number`)
      if (typeof act.end_pct !== 'number') issues.push(`acts[${i}].end_pct must be a number`)
      if (!Array.isArray(act.beats) || act.beats.length < 1) {
        issues.push(`acts[${i}].beats must be a non-empty string[]`)
      }
      if (typeof act.loop_tightener !== 'string') issues.push(`acts[${i}].loop_tightener must be a string`)
    })

    if (o.acts.length >= 3) {
      const acts = o.acts as Array<Record<string, unknown>>
      const durations = acts.map(a => ((a.end_pct as number) ?? 0) - ((a.start_pct as number) ?? 0))
      const avg = durations.reduce((s, d) => s + d, 0) / durations.length
      const allEqual = durations.every(d => Math.abs(d - avg) < 0.02)
      if (allEqual) {
        issues.push('acts durations must NOT be equal thirds — shift boundaries by ±10-20%')
      }
    }
  }

  if (!o.reveal || typeof o.reveal !== 'object') {
    issues.push('reveal must be an object')
  } else {
    const r = o.reveal as Record<string, unknown>
    if (typeof r.what_changes !== 'string' || !r.what_changes.trim()) {
      issues.push('reveal.what_changes must be a non-empty string')
    }
    if (!Array.isArray(r.recontextualizes_scenes) || r.recontextualizes_scenes.length < 2) {
      issues.push('reveal.recontextualizes_scenes must be a number[] with at least 2 items')
    }
  }

  if (!Array.isArray(o.counterattack_waves) || o.counterattack_waves.length < 2) {
    issues.push('counterattack_waves must have at least 2 items')
  }

  if (!Array.isArray(o.narrator_asides) || o.narrator_asides.length < 2) {
    issues.push('narrator_asides must have at least 2 items')
  }

  if (typeof o.cta !== 'string' || !o.cta.trim()) {
    issues.push('cta must be a non-empty string')
  }

  if (!Array.isArray(o.authenticity_checklist) || o.authenticity_checklist.length < 3) {
    issues.push('authenticity_checklist must be a string[] with at least 3 items')
  }

  return issues
}
