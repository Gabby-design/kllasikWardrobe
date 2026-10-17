import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSessionToken } from '../../../../src/lib/auth';

export const dynamic = 'force-dynamic';

async function isAdminAuthorized() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_auth')?.value;
    return Boolean(verifyAdminSessionToken(token));
  } catch (err) {
    return false;
  }
}

export async function GET() {
  const isAuthorized = await isAdminAuthorized();
  if (!isAuthorized) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin session required. Please log in.' },
      { status: 401 }
    );
  }

  // Only return boolean presence indicators and variable names. Never return secret values.
  const envPresence = {
    BLOB_READ_WRITE_TOKEN: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    KV_REST_API_URL: Boolean(process.env.KV_REST_API_URL?.trim()),
    KV_REST_API_TOKEN: Boolean(process.env.KV_REST_API_TOKEN?.trim()),
    UPSTASH_REDIS_REST_URL: Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim()),
    UPSTASH_REDIS_REST_TOKEN: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim()),
    ADMIN_SESSION_SECRET: Boolean(process.env.ADMIN_SESSION_SECRET?.trim()),
    ADMIN_PASSPHRASE: Boolean(process.env.ADMIN_PASSPHRASE?.trim()),
  };

  const readWriteTokenNames = Object.keys(process.env).filter((key) =>
    key.endsWith('_READ_WRITE_TOKEN')
  );

  return NextResponse.json({
    success: true,
    vercelEnv: process.env.VERCEL_ENV || (process.env.VERCEL ? 'production' : 'local'),
    isVercel: Boolean(process.env.VERCEL),
    envPresence,
    readWriteTokenNames,
  });
}
