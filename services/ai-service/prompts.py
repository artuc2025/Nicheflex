from __future__ import annotations


def niche_breakdown_prompt(niche_title: str, top_videos: list[dict], metrics: dict) -> str:
    videos_text = "\n".join(
        f"- \"{v['title']}\" ({v['views']:,} views, {v['channel_name']})"
        for v in top_videos[:5]
    )

    return f"""You are a YouTube niche analyst for faceless creators. Analyze this niche and provide a structured breakdown.

NICHE: {niche_title}

TOP PERFORMING VIDEOS:
{videos_text}

METRICS:
- HEAT Score: {metrics.get('heat_score', 'N/A')}
- RPM Range: ${metrics.get('rpm_low', '?')}–${metrics.get('rpm_high', '?')}
- Views (7d): {metrics.get('views_7d', 0):,}
- Views (30d): {metrics.get('views_30d', 0):,}
- Active Channels: {metrics.get('channels_count', 0)}

Provide a structured breakdown in JSON with these fields:
{{
  "why_it_works": "2-3 sentences on why this niche performs well",
  "narrative_mechanics": ["list of narrative techniques used by top videos"],
  "typical_structure": "typical video structure for this niche",
  "saturation_risk": "low/medium/high with explanation",
  "entry_barriers": ["what makes this niche easy or hard to enter"],
  "content_gaps": ["opportunities for new creators"],
  "verdict": "one-line recommendation"
}}

Return ONLY valid JSON, no markdown fences."""


def script_skeleton_prompt(
    niche_title: str,
    niche_analysis: str,
    video_format: str = "long",
) -> str:
    return f"""You are the FLEX ENGINE — an expert script skeleton generator for faceless YouTube creators.

NICHE: {niche_title}
FORMAT: {video_format}
NICHE ANALYSIS: {niche_analysis}

Generate a script skeleton using proven narrative mechanics:
- Hook: pattern interrupt or curiosity gap (first 5-15 seconds)
- Cold open: establish stakes without revealing the answer
- Mystery object: withhold key information to build tension
- Act structure: setup → escalation → reveal → payoff
- Recontextualizing reveal: flip the viewer's assumption
- CTA: natural call to action

Return a JSON object:
{{
  "title_options": ["3 alternative video titles with hooks"],
  "hook": {{
    "type": "pattern_interrupt|curiosity_gap|shock_value",
    "text": "exact opening line (first 5-15 seconds)",
    "duration": "5-15 seconds"
  }},
  "cold_open": {{
    "text": "2-3 sentences establishing stakes",
    "visual_direction": "what to show on screen"
  }},
  "acts": [
    {{
      "name": "Act name",
      "duration": "estimated duration",
      "purpose": "what this act achieves",
      "beats": ["specific content beats in this act"]
    }}
  ],
  "reveal": {{
    "type": "recontextualizing|confirmation|amplification",
    "text": "the key reveal moment",
    "setup_reference": "how the hook set this up"
  }},
  "cta": {{
    "type": "subscribe|comment|watch_next",
    "text": "natural CTA line"
  }},
  "anti_ban_notes": ["authenticity markers and variation tips to avoid AI detection"]
}}

Return ONLY valid JSON, no markdown fences."""
