'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  verifyAdminPassphrase,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '../../src/lib/auth';

export async function verifyAdminPassword(formData) {
  const password = typeof formData === 'string' ? formData : formData?.get?.('password');
  
  let isValid = false;
  try {
    isValid = verifyAdminPassphrase(password);
  } catch (err) {
    return { error: err.message };
  }

  if (isValid) {
    let sessionToken;
    try {
      sessionToken = createAdminSessionToken();
    } catch (err) {
      return { error: err.message };
    }

    const cookieStore = await cookies();
    cookieStore.set('admin_auth', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    revalidatePath('/admin');
    redirect('/admin');
  } else {
    return { error: 'Incorrect administrator passphrase' };
  }
}

export async function checkAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_auth')?.value;
    return verifyAdminSessionToken(token);
  } catch {
    return false;
  }
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_auth');
  revalidatePath('/admin');
  return { success: true };
}
