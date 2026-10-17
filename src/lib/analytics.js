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
 * Record a page visit from an anonymous visitor ID.
 * Uses a single Redis pipeline per counted hit.
 * Enforces:
 * - Africa/Lagos daily keys with 90-day TTL (7,776,000s).
 * - All-time HyperLogLog & cumulative pageviews without expiry.
 * - Per-visitor rate limit of 1 counted hit per path per 30 seconds.
 * - Online-now sorted set with 5-minute active window.
 * - Daily top pages (ZINCRBY) and country breakdown (HINCRBY).
 */
export async function recordVisitorHit({ visitorId, path = '/', country = 'Unknown' }) {
  const redis = getRedis();
  if (!redis) {
    throw new Error('Redis connection unavailable: check KV_REST_API_URL and KV_REST_API_TOKEN');
  }

  const safeVid = String(visitorId).trim().slice(0, 64);
  const safePath = String(path).trim().slice(0, 200);
  const safeCountry = String(country || 'Unknown').trim().toUpperCase().slice(0, 8);

  const nowSec = Math.floor(Date.now() / 1000);
  const lagosDate = getLagosDateStr();
  const DAILY_TTL = 90 * 24 * 60 * 60; // 90 days = 7,776,000 seconds

  // Rate limit: 1 counted hit per visitor per path per 30 seconds
  const rlKey = `klasik:analytics:rl:${safeVid}:${encodeURIComponent(safePath)}`;
  const acquired = await redis.set(rlKey, '1', { nx: true, ex: 30 });

  if (!acquired) {
    // Already counted recently; update active timestamp in online_now without double counting hits
    try {
      await redis.zadd(REDIS_ANALYTICS_ONLINE_NOW, { score: nowSec, member: safeVid });
    } catch {}
    return { ok: true, rateLimited: true };
  }

  // Single Redis pipeline per counted hit
  const p = redis.pipeline();

  // 1. Page views: cumulative (no TTL) and daily (90-day TTL)
  p.incr(REDIS_ANALYTICS_TOTAL_VIEWS);
  p.incr(`klasik:analytics:pageviews:${lagosDate}`);
  p.expire(`klasik:analytics:pageviews:${lagosDate}`, DAILY_TTL);

  // 2. Unique visitors: all-time HyperLogLog (no TTL) and daily HyperLogLog (90-day TTL)
  p.pfadd(REDIS_ANALYTICS_ALL_VISITORS, safeVid);
  p.pfadd(`klasik:analytics:visitors:${lagosDate}`, safeVid);
  p.expire(`klasik:analytics:visitors:${lagosDate}`, DAILY_TTL);

  // 3. Top pages: daily sorted set (90-day TTL)
  p.zincrby(`klasik:analytics:top_pages:${lagosDate}`, 1, safePath);
  p.expire(`klasik:analytics:top_pages:${lagosDate}`, DAILY_TTL);

  // 4. Country breakdown: daily hash (90-day TTL)
  if (safeCountry) {
    p.hincrby(`klasik:analytics:countries:${lagosDate}`, safeCountry, 1);
    p.expire(`klasik:analytics:countries:${lagosDate}`, DAILY_TTL);
  }

  // 5. Online now: sorted set of active visitors (last 5 min window)
  p.zadd(REDIS_ANALYTICS_ONLINE_NOW, { score: nowSec, member: safeVid });
  p.zremrangebyscore(REDIS_ANALYTICS_ONLINE_NOW, 0, nowSec - 300);

  await p.exec();
  return { ok: true, counted: true };
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

  // 7 onwards: 7-day stats (visitors, views, top pages)
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
  const countries = (res[6] && typeof res[6] === 'object') ? res[6] : {};

  const history = [];
  const topPagesMap = new Map();

  let offset = 7;
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
    history,
    topPages,
    countries,
    lastUpdated: new Date().toISOString(),
  };
}
