'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const ALLOWED_PASSPHRASES = ['kllasik2026', 'klasik2026'];

export async function verifyAdminPassword(formData) {
  const password = typeof formData === 'string' ? formData : formData?.get?.('password');
  const envPassphrase = process.env.ADMIN_PASSPHRASE;
  const isMatch = password && (
    ALLOWED_PASSPHRASES.includes(password.trim()) ||
    (envPassphrase && password.trim() === envPassphrase.trim())
  );
  
  if (isMatch) {
    const cookieStore = await cookies();
    cookieStore.set('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    revalidatePath('/admin');
    redirect('/admin');
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
