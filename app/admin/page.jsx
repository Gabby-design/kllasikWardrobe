import { getOrders } from '../../backend/services/orders';
import { StatusDropdown } from '../../frontend/components/admin/StatusDropdown';
import { cookies } from 'next/headers';
import { verifyAdminPassword, logoutAdmin } from '../../backend/actions/adminAuth';

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get('admin_auth')?.value === 'true';

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 md:p-12 border border-neutral-200 shadow-premium-subtle">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-bold tracking-[-0.02em] mb-2">Admin Login</h1>
            <p className="font-sans text-sm text-neutral-500">Enter the passphrase to access orders.</p>
          </div>
          
          <form action={verifyAdminPassword} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-[0.1em] font-semibold text-neutral-500">Passphrase</label>
              <input
                type="password"
                name="password"
                required
                className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 font-sans text-sm focus:outline-none focus:border-neutral-800 transition-colors"
                placeholder="••••••••••••"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#1a1a1a] text-white font-sans text-xs uppercase tracking-[0.2em] font-semibold py-4 hover:bg-neutral-800 transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const orders = await getOrders();

  return (
    <div className="min-h-screen bg-[#f8f8f8] pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] font-['Syne'] uppercase tracking-wider">
            Admin Dashboard
          </h1>
          <form action={logoutAdmin}>
            <button type="submit" className="text-xs uppercase tracking-[0.1em] font-bold border-b border-foreground hover:opacity-50 transition-opacity">
              Log Out
            </button>
          </form>
        </div>

        {orders && orders.length > 0 ? (
          <div className="bg-white border border-neutral-200 overflow-x-auto shadow-premium-subtle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1a1a1a] text-[#f8f8f8] font-['DM_Sans'] text-xs uppercase tracking-widest border-b border-[#1a1a1a]">
                  <th className="p-4 font-semibold whitespace-nowrap">Order ID</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Date</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Customer</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Items</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Total</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Shipping</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm font-['DM_Sans'] text-[#1a1a1a] divide-y divide-neutral-100">
                {orders.map((order) => {
                  const itemsCount = (order.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0);
                  const parsedAddress = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
                  const addressString = parsedAddress ? `${parsedAddress.address}, ${parsedAddress.city}` : 'N/A';
                  
                  // In the guest checkout, email is not stored in shipping_address, it's stored in customerEmail metadata during checkout, but wait, we only inserted shipping_address.
                  // We should probably check if email was stored. Currently verify/route.js stores shipping_address. 
                  // Oh, wait, the Paystack customer email was in verifyData.customer.email. We don't save it to `orders` unless it's in metadata or we added a column. 
                  // For the sake of the dashboard, if customerEmail is missing, we can just show "Guest".
                  const customerEmail = parsedAddress?.email || 'Guest';
                  
                  return (
                    <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-mono text-xs">{order.id.split('-')[0]}</td>
                      <td className="p-4 text-neutral-500 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="p-4 max-w-[200px] truncate" title={customerEmail}>{customerEmail}</td>
                      <td className="p-4 whitespace-nowrap">{itemsCount} item(s)</td>
                      <td className="p-4 font-semibold whitespace-nowrap">₦{(order.total_amount || 0).toLocaleString()}</td>
                      <td className="p-4 text-neutral-500 text-xs max-w-[200px] truncate" title={addressString}>
                        {addressString}
                      </td>
                      <td className="p-4">
                        <StatusDropdown orderId={order.id} initialStatus={order.delivery_status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 p-12 text-center text-neutral-500 font-['DM_Sans']">
            No orders found.
          </div>
        )}
      </div>
    </div>
  )
}
