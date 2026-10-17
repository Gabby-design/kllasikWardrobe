import { NextResponse } from 'next/server.js';
import { cookies } from 'next/headers.js';
import { verifyAdminSessionToken, verifyAdminPassphrase } from '../../../../src/lib/auth.js';
import { getRedis, REDIS_HASH_KEY, parseRedisProduct } from '../../../../src/lib/db.js';
import { getAnalyticsMetrics } from '../../../../src/lib/analytics.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function isAuthorized(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_auth')?.value;
    if (token && verifyAdminSessionToken(token)) return true;
  } catch {}

  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (verifyAdminSessionToken(bearer) || verifyAdminPassphrase(bearer)) {
      return true;
    }
  }

  const passphraseHeader = request.headers.get('x-admin-passphrase');
  if (passphraseHeader && verifyAdminPassphrase(passphraseHeader)) {
    return true;
  }

  return false;
}

export async function GET(request) {
  const authorized = await isAuthorized(request);
  if (!authorized) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  let redisConnected = false;
  let productCount = 0;
  let newestUpdatedAt = 0;

  try {
    const redis = getRedis();
    if (redis) {
      const pingRes = await redis.ping();
      if (pingRes === 'PONG' || pingRes) {
        redisConnected = true;
        const count = await redis.hlen(REDIS_HASH_KEY);
        productCount = Number(count || 0);

        const allValues = await redis.hvals(REDIS_HASH_KEY);
        if (Array.isArray(allValues)) {
          for (const raw of allValues) {
            const prod = parseRedisProduct(raw);
            if (prod && prod.updatedAt) {
              const time = new Date(prod.updatedAt).getTime();
              if (!isNaN(time) && time > newestUpdatedAt) {
                newestUpdatedAt = time;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    redisConnected = false;
  }

  let analytics = null;
  if (redisConnected) {
    try {
      const metrics = await getAnalyticsMetrics();
      analytics = {
        totalVisitors: metrics.totalVisitors,
        todayVisitors: metrics.todayVisitors,
        totalPageViews: metrics.totalPageViews,
        todayPageViews: metrics.todayPageViews,
        onlineNow: metrics.onlineNow,
      };
    } catch (err) {
      analytics = { error: err.message || 'Analytics unavailable' };
    }
  }

  const blobEnvPresent = Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    Object.keys(process.env).some(
      (k) => (k.endsWith('_READ_WRITE_TOKEN') || k.includes('BLOB_READ_WRITE')) && process.env[k]?.trim()
    )
  );

  const vercelEnv = process.env.VERCEL_ENV || (process.env.VERCEL ? 'production' : 'development');

  return NextResponse.json({
    redisConnected,
    productCount,
    newestUpdatedAt,
    blobEnvPresent,
    vercelEnv,
    VERCEL_ENV: vercelEnv,
    analytics,
  });
}
