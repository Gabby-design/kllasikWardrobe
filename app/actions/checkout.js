'use server';

import { createAdminClient } from '../../utils/supabase/admin.js';
import { sendOwnerOrderNotification, sendCustomerReceipt, DEFAULT_OWNER_EMAIL } from '../../lib/email.js';

export async function submitManualOrder(cart, customerForm, totalAmount) {
  console.log('--- NEW CHECKOUT INITIATED ---');
  
  try {
    if (!cart || cart.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    if (!customerForm || !customerForm.email) {
      return { success: false, error: 'Customer email is required' };
    }

    console.log('1. Initializing Supabase...');
    const supabase = createAdminClient();

    console.log('2. Preparing Order Payload (Guest Checkout)...');
    const shippingAddress = {
      name: customerForm.name || 'Guest',
      email: customerForm.email,
      phone: customerForm.phone || '',
      address: customerForm.address || '',
      city: customerForm.city || 'Lagos',
      notes: customerForm.notes || ''
    };

    const orderPayload = {
      items: cart,
      total_amount: totalAmount,
      payment_status: 'Pending Transfer',
      delivery_status: 'Processing',
      shipping_address: JSON.stringify(shippingAddress)
    };

    console.log('3. Inserting into Supabase...');
    let orderId = null;
    const { data, error: dbError } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select();

    if (dbError) {
      console.error('❌ SUPABASE ERROR DETAILS:', dbError);
      const errorMessage = dbError.hint 
        ? `${dbError.message} (${dbError.hint})`
        : dbError.message || 'Database error: failed to record order';
      return { success: false, error: errorMessage };
    }

    if (data && data.length > 0) {
      orderId = data[0].id;
    }
    console.log('✅ Supabase Insert Successful! Order ID:', orderId);

    console.log('3.5. Decrementing Stock...');
    for (const item of cart) {
      if (item.id) {
        try {
          const { error: stockError } = await supabase.rpc('decrement_stock', {
            p_id: item.id,
            qty: item.quantity || 1
          });
          if (stockError) {
            console.warn(`⚠️ Failed to decrement stock for product ${item.id}:`, stockError.message);
          }
        } catch (rpcErr) {
          console.warn(`⚠️ RPC decrement_stock error for product ${item.id}:`, rpcErr.message);
        }
      }
    }

    console.log('4. Dispatching Email Notifications...');
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    const shippingCost = totalAmount > 70000 ? 0 : 4500;

    try {
      await Promise.allSettled([
        sendOwnerOrderNotification({
          orderId: orderId || `KLASIK-${Date.now().toString().slice(-6)}`,
          items: cart,
          customer: {
            name: customerForm.name,
            email: customerForm.email,
            phone: customerForm.phone,
            address: customerForm.address,
            city: customerForm.city || 'Lagos',
            notes: customerForm.notes
          },
          totalAmount: totalAmount,
          subtotal: subtotal,
          shippingCost: shippingCost,
          ownerEmail: process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL
        }),
        sendCustomerReceipt({
          orderId: orderId || `KLASIK-${Date.now().toString().slice(-6)}`,
          items: cart,
          customer: {
            name: customerForm.name,
            email: customerForm.email,
            phone: customerForm.phone,
            address: customerForm.address,
            city: customerForm.city || 'Lagos'
          },
          totalAmount: totalAmount,
          subtotal: subtotal,
          shippingCost: shippingCost
        })
      ]);
      console.log('✅ Order notification emails dispatched to owner & customer');
    } catch (emailError) {
      console.error('⚠️ Email notification error:', emailError);
    }

    console.log('--- CHECKOUT COMPLETE ---');
    return { success: true, orderId };

  } catch (error) {
    console.error('❌ CRITICAL ACTION ERROR:', error);
    return { success: false, error: error.message || 'An unexpected error occurred during checkout.' };
  }
}

