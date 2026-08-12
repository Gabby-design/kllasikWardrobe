'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function verifyAdminPassword(formData) {
  const password = formData.get('password');
  
  if (password === process.env.ADMIN_PASSPHRASE) {
    const cookieStore = await cookies();
    cookieStore.set('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });
    revalidatePath('/admin');
    return { success: true };
  } else {
    return { error: 'Incorrect passphrase' };
  }
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_auth');
  revalidatePath('/admin');
}
