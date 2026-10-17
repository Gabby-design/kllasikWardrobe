import { NextResponse } from 'next/server';
import {
  verifyAdminPassphrase,
  createAdminSessionToken,
} from '../../../../src/lib/auth';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') || searchParams.get('passphrase') || searchParams.get('p') || '';

    if (key && verifyAdminPassphrase(key)) {
      const sessionToken = createAdminSessionToken();
      const res = NextResponse.redirect(new URL('/admin', req.url));
      res.cookies.set('admin_auth', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return res;
    }
  } catch {}
  return NextResponse.redirect(new URL('/admin', req.url));
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = body?.password || '';

    let isMatch = false;
    try {
      isMatch = verifyAdminPassphrase(password);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }

    if (isMatch) {
      let sessionToken;
      try {
        sessionToken = createAdminSessionToken();
      } catch (err) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 500 }
        );
      }

      const res = NextResponse.json({ success: true });
      res.cookies.set('admin_auth', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
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
