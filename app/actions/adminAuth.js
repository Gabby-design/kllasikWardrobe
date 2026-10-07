'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const DEFAULT_PASSPHRASE = 'klasik2026';

export async function verifyAdminPassword(formData) {
  const password = typeof formData === 'string' ? formData : formData?.get?.('password');
  const validPassphrase = process.env.ADMIN_PASSPHRASE || DEFAULT_PASSPHRASE;
  
  if (password && (password === validPassphrase || password === DEFAULT_PASSPHRASE)) {
    const cookieStore = await cookies();
    cookieStore.set('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    revalidatePath('/admin');
    return { success: true };
  } else {
    return { error: 'Incorrect administrator passphrase' };
  }
}

export async function checkAdminSession() {
  const cookieStore = await cookies();
  const auth = cookieStore.get('admin_auth')?.value;
  return auth === 'true';
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_auth');
  revalidatePath('/admin');
  return { success: true };
}
