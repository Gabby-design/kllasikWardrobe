import { cookies } from 'next/headers';
import { createAdminClient } from '../../utils/supabase/admin';
import { getAllProducts } from '../../src/data/productsManager';
import { AdminDashboard } from '../../src/components/admin/AdminDashboard';
import { AdminLoginForm } from '../../src/components/admin/AdminLoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }) {
  const cookieStore = await cookies();
  const sp = await searchParams;
  const key = sp?.key || sp?.passphrase || sp?.p;
  
  const isKeyValid = key && ['kllasik2026', 'klasik2026'].includes(key.trim());
  
  if (isKeyValid) {
    try {
      cookieStore.set('admin_auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });
    } catch {}
  }

  const isAuthenticated = isKeyValid || cookieStore.get('admin_auth')?.value === 'true';

  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  // Load products
  const products = getAllProducts();

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

  return (
    <AdminDashboard initialProducts={products} initialOrders={orders} />
  );
}
