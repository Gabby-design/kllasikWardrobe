import { cookies } from 'next/headers';
import { checkAdminSession } from '../actions/adminAuth';
import { verifyAdminPassphrase, createAdminSessionToken } from '../../src/lib/auth';
import { createAdminClient } from '../../utils/supabase/admin';
import { getAuthoritativeProducts } from '../../src/lib/db';
import { AdminDashboard } from '../../src/components/admin/AdminDashboard';
import { AdminLoginForm } from '../../src/components/admin/AdminLoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }) {
  const cookieStore = await cookies();
  const sp = await searchParams;
  const key = sp?.key || sp?.passphrase || sp?.p;

  if (key) {
    try {
      if (verifyAdminPassphrase(key)) {
        const sessionToken = createAdminSessionToken();
        cookieStore.set('admin_auth', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });
      }
    } catch {}
  }

  const isAuthenticated = await checkAdminSession();

  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  // Load products directly from authoritative database (safe fallback)
  let products = [];
  try {
    products = await getAuthoritativeProducts();
  } catch (err) {
    console.warn('Authoritative products query notice:', err.message);
  }

  // Load orders (with graceful fallback if Supabase is offline)
  let orders = [];
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        orders = data;
      }
    }
  } catch (err) {
    console.warn('Orders query notice:', err.message);
  }

  const isDbConfigured = Boolean(
    (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
    (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
  );

  return (
    <AdminDashboard
      initialProducts={products}
      initialOrders={orders}
      isDatabaseConfigured={isDbConfigured}
    />
  );
}
