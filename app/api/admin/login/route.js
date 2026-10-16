import { NextResponse } from 'next/server';

const ALLOWED_PASSPHRASES = ['kllasik2026', 'klasik2026'];

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = body?.password || '';
    const envPassphrase = process.env.ADMIN_PASSPHRASE;

    const isMatch = password && (
      ALLOWED_PASSPHRASES.includes(password.trim()) ||
      (envPassphrase && password.trim() === envPassphrase.trim())
    );

    if (isMatch) {
      const res = NextResponse.json({ success: true });
      res.cookies.set('admin_auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });
      return res;
    }

    return NextResponse.json(
      { success: false, error: 'Incorrect administrator passphrase' },
      { status: 401 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
