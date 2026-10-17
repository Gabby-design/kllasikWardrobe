import { NextResponse } from 'next/server.js';
import { recordVisitorHit } from '../../../src/lib/analytics.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baiduspider/i,
  /duckduckbot/i,
  /slurp/i,
  /lighthouse/i,
  /headlesschrome/i,
  /bytespider/i,
  /petalbot/i,
  /semrush/i,
  /ahrefs/i,
];

const STATIC_EXTENSIONS = /\.(jpg|jpeg|png|webp|svg|ico|css|js|map|txt|xml|json|woff|woff2|ttf|eot)$/i;

export async function POST(req) {
  try {
    // 1. Filter known crawlers and bots by User-Agent
    const userAgent = req.headers.get('user-agent') || '';
    if (BOT_PATTERNS.some((p) => p.test(userAgent))) {
      return NextResponse.json({ ok: true, ignored: 'bot' }, { status: 200 });
    }

    // 2. Read body with request.text() and JSON.parse (navigator.sendBeacon sends text/plain)
    const raw = await req.text();
    let body = null;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ ok: false, error: 'malformed_json' }, { status: 200 });
    }

    const { visitorId, path = '/' } = body || {};

    // 3. Validate visitorId (UUID-like, max 64 chars)
    if (
      !visitorId ||
      typeof visitorId !== 'string' ||
      visitorId.length > 64 ||
      !/^[a-zA-Z0-9_\-:.]{6,64}$/.test(visitorId)
    ) {
      return NextResponse.json({ ok: false, error: 'invalid_visitor_id' }, { status: 200 });
    }

    // 4. Validate path (starts with "/", max 200 chars)
    if (
      !path ||
      typeof path !== 'string' ||
      !path.startsWith('/') ||
      path.length > 200
    ) {
      return NextResponse.json({ ok: false, error: 'invalid_path' }, { status: 200 });
    }

    // 5. Ignore /admin, /api, and static paths
    if (
      path.startsWith('/admin') ||
      path.startsWith('/api') ||
      path.startsWith('/_next') ||
      path.startsWith('/images/') ||
      path.includes('favicon.ico') ||
      STATIC_EXTENSIONS.test(path)
    ) {
      return NextResponse.json({ ok: true, ignored: 'internal_or_static' }, { status: 200 });
    }

    // 6. Optional: extract country from x-vercel-ip-country header
    const country =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      'Unknown';

    // 7. Execute tracking hit (handles per-visitor rate limit & single pipeline)
    const result = await recordVisitorHit({ visitorId, path, country });
    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (err) {
    // Always return 200 quickly and never throw to the client
    return NextResponse.json({ ok: true, error: err.message }, { status: 200 });
  }
}
