import { cookies } from 'next/headers';
import { verifyAdminPassword } from '../actions/adminAuth';
import { createAdminClient } from '../../utils/supabase/admin';
import { getAllProducts } from '../../src/data/productsManager';
import { AdminDashboard } from '../../src/components/admin/AdminDashboard';
import { KlasikLogo } from '../../src/components/KlasikLogo';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('admin_auth')?.value === 'true';

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex flex-col items-center justify-center p-4 font-sans">
        
        <div className="w-full max-w-md bg-white rounded-[24px] border border-black/[0.04] p-8 sm:p-10 shadow-[0_8px_24px_rgba(17,17,17,0.06)] text-center">
          
          <div className="mb-6 flex justify-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <KlasikLogo height={32} className="w-auto" fill="#111111" />
            </Link>
          </div>

          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] text-xs font-bold border border-[#DDD6FE] mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Concierge Admin</span>
            </span>

            <h1 className="text-2xl font-bold tracking-tight text-[#111111] mb-2">
              Admin Dashboard
            </h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              Enter your store passphrase to manage products, catalog pricing, and orders.
            </p>
          </div>

          <form action={verifyAdminPassword} className="flex flex-col gap-4 text-left">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                Admin Passphrase
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  autoFocus
                  placeholder="Enter passphrase"
                  className="w-full bg-[#EDEDEF] focus:bg-white border border-transparent focus:border-[#EDE9FE] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-full px-4 py-3 text-xs text-[#111111] outline-none transition-all pl-10"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-sans text-xs font-bold py-3.5 px-6 rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer mt-2"
            >
              Access Dashboard &rarr;
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-black/[0.04]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#7C3AED] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Store</span>
            </Link>
          </div>

        </div>

      </div>
    );
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
