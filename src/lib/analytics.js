import { getRedis } from './db.js';

export const REDIS_ANALYTICS_TOTAL_VIEWS = 'klasik:analytics:pageviews:total';
export const REDIS_ANALYTICS_ALL_VISITORS = 'klasik:analytics:visitors:all';
export const REDIS_ANALYTICS_ONLINE_NOW = 'klasik:analytics:online_now';

/**
 * Format a Date into Africa/Lagos (UTC+1) date string YYYY-MM-DD.
 */
export function getLagosDateStr(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Return array of past N days in Africa/Lagos timezone with labels.
 */
export function getLastNLagosDays(count = 7) {
  const days = [];
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = getLagosDateStr(d);
    const dayLabel = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(d);

    days.push({
      dateStr,
      label: i === 0 ? 'Today' : dayLabel,
    });
  }
  return days;
}

/**
 * Parse User-Agent string to detect device type, operating system, and browser.
 */
export function parseUserAgent(ua = '') {
  const s = String(ua || '').toLowerCase();

  // 1. Device category
  let device = 'Desktop';
  if (/ipad|tablet|playbook|silk/i.test(s) || (/android/i.test(s) && !/mobile/i.test(s))) {
    device = 'Tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|bb10|rim|opera mini|iemobile|wpdesktop/i.test(s)) {
    device = 'Mobile';
  }

  // 2. Operating System
  let os = 'Other';
  if (/iphone|ipad|ipod/i.test(s)) {
    os = 'iOS';
  } else if (/android/i.test(s)) {
    os = 'Android';
  } else if (/windows/i.test(s)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(s)) {
    os = 'macOS';
  } else if (/linux/i.test(s)) {
    os = 'Linux';
  }

  // 3. Browser
  let browser = 'Other';
  if (/edg\//i.test(s)) {
    browser = 'Edge';
  } else if (/chrome|crios/i.test(s) && !/opr|opera/i.test(s)) {
    browser = 'Chrome';
  } else if (/safari/i.test(s) && !/chrome|crios/i.test(s)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(s)) {
    browser = 'Firefox';
  } else if (/opr|opera/i.test(s)) {
    browser = 'Opera';
  }

  return { device, os, browser };
}

/**
 * Format duration in seconds into human-readable string (e.g. "2m 14s" or "45s").
 */
export function formatDuration(seconds) {
  const sec = Math.max(0, Math.round(Number(seconds || 0)));
  if (sec === 0) return '0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

/**
 * Record a page visit from an anonymous visitor ID.
 * Tracks device category (Mobile/Desktop/Tablet) and OS.
 */
export async function recordVisitorHit({ visitorId, path = '/', country = 'Unknown', userAgent = '' }) {
  const redis = getRedis();
  if (!redis) {
    throw new Error('Redis connection unavailable: check KV_REST_API_URL and KV_REST_API_TOKEN');
  }

  const safeVid = String(visitorId).trim().slice(0, 64);
  const safePath = String(path).trim().slice(0, 200);
  const safeCountry = String(country || 'Unknown').trim().toUpperCase().slice(0, 8);
  const { device, os } = parseUserAgent(userAgent);

  const nowSec = Math.floor(Date.now() / 1000);
  const lagosDate = getLagosDateStr();
  const DAILY_TTL = 90 * 24 * 60 * 60; // 90 days = 7,776,000 seconds

  // Rate limit: 1 counted hit per visitor per path per 30 seconds
  const rlKey = `klasik:analytics:rl:${safeVid}:${encodeURIComponent(safePath)}`;
  const acquired = await redis.set(rlKey, '1', { nx: true, ex: 30 });

  if (!acquired) {
    try {
      await redis.zadd(REDIS_ANALYTICS_ONLINE_NOW, { score: nowSec, member: safeVid });
    } catch {}
    return { ok: true, rateLimited: true, device, os };
  }

  // Single Redis pipeline per counted hit
  const p = redis.pipeline();

  // 1. Page views
  p.incr(REDIS_ANALYTICS_TOTAL_VIEWS);
  p.incr(`klasik:analytics:pageviews:${lagosDate}`);
  p.expire(`klasik:analytics:pageviews:${lagosDate}`, DAILY_TTL);

  // 2. Unique visitors
  p.pfadd(REDIS_ANALYTICS_ALL_VISITORS, safeVid);
  p.pfadd(`klasik:analytics:visitors:${lagosDate}`, safeVid);
  p.expire(`klasik:analytics:visitors:${lagosDate}`, DAILY_TTL);

  // 3. Top pages
  p.zincrby(`klasik:analytics:top_pages:${lagosDate}`, 1, safePath);
  p.expire(`klasik:analytics:top_pages:${lagosDate}`, DAILY_TTL);

  // 4. Country breakdown
  if (safeCountry) {
    p.hincrby(`klasik:analytics:countries:${lagosDate}`, safeCountry, 1);
    p.expire(`klasik:analytics:countries:${lagosDate}`, DAILY_TTL);
  }

  // 5. Device and OS breakdown
  p.hincrby(`klasik:analytics:devices:${lagosDate}`, device, 1);
  p.expire(`klasik:analytics:devices:${lagosDate}`, DAILY_TTL);
  p.hincrby(`klasik:analytics:os:${lagosDate}`, os, 1);
  p.expire(`klasik:analytics:os:${lagosDate}`, DAILY_TTL);

  // 6. Online now
  p.zadd(REDIS_ANALYTICS_ONLINE_NOW, { score: nowSec, member: safeVid });
  p.zremrangebyscore(REDIS_ANALYTICS_ONLINE_NOW, 0, nowSec - 300);

  await p.exec();
  return { ok: true, counted: true, device, os };
}

/**
 * Record active session browsing time / heartbeat.
 * Tracks total duration, session counts, and engagement duration buckets.
 */
export async function recordSessionHeartbeat({ visitorId, durationSeconds = 0, deltaSeconds = 0 }) {
  const redis = getRedis();
  if (!redis) throw new Error('Redis connection unavailable');

  const safeVid = String(visitorId).trim().slice(0, 64);
  const nowSec = Math.floor(Date.now() / 1000);
  const lagosDate = getLagosDateStr();
  const DAILY_TTL = 90 * 24 * 60 * 60;

  const safeDelta = Math.min(60, Math.max(0, Math.round(Number(deltaSeconds || 0))));
  const safeTotal = Math.min(7200, Math.max(0, Math.round(Number(durationSeconds || 0))));

  const p = redis.pipeline();

  // Keep online_now timestamp updated
  p.zadd(REDIS_ANALYTICS_ONLINE_NOW, { score: nowSec, member: safeVid });

  if (safeDelta > 0) {
    p.incrby(`klasik:analytics:duration:seconds:${lagosDate}`, safeDelta);
    p.expire(`klasik:analytics:duration:seconds:${lagosDate}`, DAILY_TTL);
  }

  // If session duration is reported
  if (safeTotal >= 5) {
    let bucket = '< 30s';
    if (safeTotal >= 300) bucket = '5m+';
    else if (safeTotal >= 120) bucket = '2m - 5m';
    else if (safeTotal >= 30) bucket = '30s - 2m';

    const sessionRegisteredKey = `klasik:analytics:duration:sess_reg:${safeVid}:${lagosDate}`;
    const isFirstReport = await redis.set(sessionRegisteredKey, '1', { nx: true, ex: 86400 });
    if (isFirstReport) {
      p.incr(`klasik:analytics:duration:sessions:${lagosDate}`);
      p.expire(`klasik:analytics:duration:sessions:${lagosDate}`, DAILY_TTL);
    }

    p.hincrby(`klasik:analytics:duration:buckets:${lagosDate}`, bucket, 1);
    p.expire(`klasik:analytics:duration:buckets:${lagosDate}`, DAILY_TTL);
  }

  await p.exec();
  return { ok: true };
}

/**
 * Fetch aggregated analytics metrics for the admin dashboard.
 * NEVER returns fake zeros: throws if Redis is unavailable or fails.
 */
export async function getAnalyticsMetrics() {
  const redis = getRedis();
  if (!redis) {
    throw new Error('Database configuration missing: Redis is unavailable (check KV_REST_API_URL and KV_REST_API_TOKEN)');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const lagosDate = getLagosDateStr();
  const days = getLastNLagosDays(7);

  const p = redis.pipeline();

  // 0: All-time unique visitors
  p.pfcount(REDIS_ANALYTICS_ALL_VISITORS);
  // 1: Today's unique visitors
  p.pfcount(`klasik:analytics:visitors:${lagosDate}`);
  // 2: Total page views
  p.get(REDIS_ANALYTICS_TOTAL_VIEWS);
  // 3: Today's page views
  p.get(`klasik:analytics:pageviews:${lagosDate}`);
  // 4: Online now (active in last 300 seconds)
  p.zcount(REDIS_ANALYTICS_ONLINE_NOW, nowSec - 300, '+inf');
  // 5: Clean up old online entries
  p.zremrangebyscore(REDIS_ANALYTICS_ONLINE_NOW, 0, nowSec - 300);
  // 6: Today's country breakdown
  p.hgetall(`klasik:analytics:countries:${lagosDate}`);
  // 7: Today's device breakdown
  p.hgetall(`klasik:analytics:devices:${lagosDate}`);
  // 8: Today's OS breakdown
  p.hgetall(`klasik:analytics:os:${lagosDate}`);
  // 9: Today's total active duration seconds
  p.get(`klasik:analytics:duration:seconds:${lagosDate}`);
  // 10: Today's recorded duration sessions
  p.get(`klasik:analytics:duration:sessions:${lagosDate}`);
  // 11: Today's duration engagement buckets
  p.hgetall(`klasik:analytics:duration:buckets:${lagosDate}`);

  // 12 onwards: 7-day stats (visitors, views, top pages)
  for (const d of days) {
    p.pfcount(`klasik:analytics:visitors:${d.dateStr}`);
    p.get(`klasik:analytics:pageviews:${d.dateStr}`);
    p.zrange(`klasik:analytics:top_pages:${d.dateStr}`, 0, 10, { rev: true, withScores: true });
  }

  const res = await p.exec();
  if (!Array.isArray(res)) {
    throw new Error('Failed to query analytics from Redis: response was not an array');
  }

  const totalVisitors = Number(res[0] || 0);
  const todayVisitors = Number(res[1] || 0);
  const totalPageViews = Number(res[2] || 0);
  const todayPageViews = Number(res[3] || 0);
  const onlineNow = Number(res[4] || 0);
  const countries = (res[6] && typeof res[6] === 'object' && !Array.isArray(res[6])) ? res[6] : {};
  const rawDevices = (res[7] && typeof res[7] === 'object' && !Array.isArray(res[7])) ? res[7] : {};
  const operatingSystems = (res[8] && typeof res[8] === 'object' && !Array.isArray(res[8])) ? res[8] : {};
  const totalDurationSeconds = Number(res[9] || 0);
  const totalSessions = Number(res[10] || 0);
  const durationBuckets = (res[11] && typeof res[11] === 'object' && !Array.isArray(res[11])) ? res[11] : {};

  // Compute average duration
  const effectiveSessions = totalSessions > 0 ? totalSessions : (todayVisitors > 0 ? todayVisitors : 1);
  const avgDurationSec = totalDurationSeconds > 0 ? Math.round(totalDurationSeconds / effectiveSessions) : 0;
  const avgDurationFormatted = formatDuration(avgDurationSec);

  // Format device breakdown with percentages
  const deviceTotal = Object.values(rawDevices).reduce((sum, v) => sum + Number(v || 0), 0);
  const devices = {
    Mobile: Number(rawDevices.Mobile || 0),
    Desktop: Number(rawDevices.Desktop || 0),
    Tablet: Number(rawDevices.Tablet || 0),
    mobilePct: deviceTotal > 0 ? Math.round((Number(rawDevices.Mobile || 0) / deviceTotal) * 100) : 0,
    desktopPct: deviceTotal > 0 ? Math.round((Number(rawDevices.Desktop || 0) / deviceTotal) * 100) : 0,
    tabletPct: deviceTotal > 0 ? Math.round((Number(rawDevices.Tablet || 0) / deviceTotal) * 100) : 0,
    totalHits: deviceTotal,
  };

  const history = [];
  const topPagesMap = new Map();

  let offset = 12;
  for (let i = 0; i < days.length; i++) {
    const dayVisitors = Number(res[offset] || 0);
    const dayViews = Number(res[offset + 1] || 0);
    const dayTopPages = res[offset + 2];

    history.push({
      date: days[i].dateStr,
      label: days[i].label,
      visitors: dayVisitors,
      pageViews: dayViews,
    });

    if (Array.isArray(dayTopPages)) {
      for (let j = 0; j < dayTopPages.length; j++) {
        const item = dayTopPages[j];
        if (typeof item === 'object' && item !== null && 'member' in item) {
          const path = String(item.member);
          const score = Number(item.score || 0);
          topPagesMap.set(path, (topPagesMap.get(path) || 0) + score);
        } else if (typeof item === 'string' && j + 1 < dayTopPages.length && typeof dayTopPages[j + 1] === 'number') {
          const path = item;
          const score = Number(dayTopPages[j + 1] || 0);
          topPagesMap.set(path, (topPagesMap.get(path) || 0) + score);
          j++;
        }
      }
    }

    offset += 3;
  }

  const topPages = Array.from(topPagesMap.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return {
    totalVisitors,
    todayVisitors,
    totalPageViews,
    todayPageViews,
    onlineNow,
    avgDurationSec,
    avgDurationFormatted,
    devices,
    operatingSystems,
    durationBuckets,
    history,
    topPages,
    countries,
    lastUpdated: new Date().toISOString(),
  };
}
