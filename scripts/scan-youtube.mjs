/**
 * scan-youtube.mjs — Reference: per-video outlier detection + HEAT scoring
 *
 * Proven ratio/HEAT logic ported to NicheHeat server.
 * This file is kept as a reference; the live implementation lives in
 * server/utils/youtube.ts + server/api/scan.post.ts.
 */

const WEIGHTS = { reach: 0.30, ratio: 0.30, recency: 0.25, replicability: 0.15 };

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

/**
 * Per-video outlier detection
 * For each video compute ratio = videoViews / channelAvgViews
 * where channelAvgViews = channel.statistics.viewCount / max(1, channel.videoCount)
 */
function computeOutlier(video, channel) {
  const views = parseInt(video.statistics.viewCount || '0', 10);
  const subs = parseInt(channel.statistics.subscriberCount || '0', 10);
  const channelVideos = Math.max(1, parseInt(channel.statistics.videoCount || '1', 10));
  const channelTotalViews = parseInt(channel.statistics.viewCount || '0', 10);

  const channelAvgViews = channelTotalViews / channelVideos;
  const ratio = views / Math.max(1, channelAvgViews);

  return { views, subs, ratio, channelAvgViews };
}

/**
 * PER-VIDEO HEAT — weighted score from 4 components
 *
 * ratioN     = clamp01( log10(max(1,ratio)) / log10(24) )
 * recencyN   = clamp01( 1 - ageDays / daysBack )
 * replicabilityN = clamp01( 1 - log10(max(1,subs)) / log10(300000) )
 * reachN     = clamp01( log10(max(1,views)) / 6.5 )
 *
 * heat = reach*reachN + ratio*ratioN + recency*recencyN + replicability*replicabilityN
 */
function computeHeat({ views, subs, ratio, ageDays, daysBack = 90 }) {
  const ratioN = clamp01(Math.log10(Math.max(1, ratio)) / Math.log10(24));
  const recencyN = clamp01(1 - ageDays / daysBack);
  const replicabilityN = clamp01(1 - Math.log10(Math.max(1, subs)) / Math.log10(300000));
  const reachN = clamp01(Math.log10(Math.max(1, views)) / 6.5);

  const heat = WEIGHTS.reach * reachN
    + WEIGHTS.ratio * ratioN
    + WEIGHTS.recency * recencyN
    + WEIGHTS.replicability * replicabilityN;

  return { heat, ratioN, recencyN, replicabilityN, reachN };
}

/**
 * FILTER criteria (long-form defaults):
 *   ratio >= 5
 *   views >= 30000
 *   subs <= 300000
 *   duration in [300, 1200] seconds
 *   title NOT matching excludeKeywords regex
 */
const EXCLUDE_KEYWORDS = [
  'suvichar', 'hindi', 'urdu', 'kahaniya', 'kahani', 'animated story'
];
const excludeRegex = new RegExp(EXCLUDE_KEYWORDS.join('|'), 'i');

function qualifies(outlier, durationSec) {
  return outlier.ratio >= 5
    && outlier.views >= 30000
    && outlier.subs <= 300000
    && durationSec >= 300
    && durationSec <= 1200
    && !excludeRegex.test(outlier.title);
}

/**
 * NICHE-LEVEL heat = mean of top 5 qualifying videos' per-video heat (0 if none)
 */
function nicheHeatScore(qualifyingVideos) {
  const top5 = qualifyingVideos
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 5);
  if (top5.length === 0) return 0;
  return top5.reduce((sum, v) => sum + v.heat, 0) / top5.length;
}

/**
 * PER-CATEGORY RPM estimates
 */
const CATEGORY_RPM = {
  finance:          [22, 45],
  'ai-tools':       [11, 18],
  'business-stories': [14, 24],
  'true-crime':     [10, 17],
  history:          [7, 12],
  'family-drama':   [9, 15],
  'space-science':  [8, 13],
  'horror-stories':  [6, 10],
};

function rpmForCategory(category) {
  return CATEGORY_RPM[category] || [5, 10];
}

export { computeOutlier, computeHeat, qualifies, nicheHeatScore, rpmForCategory, EXCLUDE_KEYWORDS };
