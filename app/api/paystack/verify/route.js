import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../backend/lib/supabase';
import { sendBuyerReceipt, sendOwnerNotification } from '../../../../backend/services/brevo';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.redirect(new URL('/?error=missing_reference', request.url));
  }

  try {
    // 1. Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.status || verifyData.data.status !== 'success') {
      console.error('Paystack verification failed:', verifyData);
      return NextResponse.redirect(new URL('/?error=payment_failed', request.url));
    }

    const { amount, customer, metadata } = verifyData.data;
    const amountInNaira = (amount / 100).toLocaleString();
    const customerEmail = customer.email;
    const cart = metadata?.cart || [];

    // 2. Record order in Supabase
    const supabase = createAdminClient();
    
    // We attempt to insert into 'orders' table. 
    const { error: insertError } = await supabase
      .from('orders')
      .insert([
        {
          items: cart,
          total_amount: amount / 100,
          payment_status: 'paid',
          delivery_status: 'Processing',
          shipping_address: metadata?.shippingAddress || null,
        }
      ]);

    if (insertError) {
      console.error('Failed to insert order:', insertError);
    }

    // Decrement stock for each item in the order
    for (const item of cart) {
      if (item.id) {
        const { error: stockError } = await supabase.rpc('decrement_stock', {
          p_id: item.id,
          qty: item.quantity
        });
        if (stockError) {
          console.error(`Failed to decrement stock for product ${item.id}:`, stockError);
        }
      }
    }

    // 3. Send Confirmation Emails via Brevo
    const productsSummary = cart.map(item => {
      return `<p>- ${item.title} - ${item.size} (${item.color}) (Qty: ${item.quantity})</p>`;
    }).join('');

    try {
      await Promise.all([
        sendBuyerReceipt({
          buyerEmail: customerEmail,
          buyerName: customer.first_name || '',
          orderDetails: productsSummary,
          totalAmount: amountInNaira
        }),
        sendOwnerNotification({
          ownerEmail: process.env.OWNER_EMAIL,
          buyerEmail: customerEmail,
          buyerName: customer.first_name || '',
          orderDetails: productsSummary,
          totalAmount: amountInNaira,
          shippingAddress: metadata?.shippingAddress || 'N/A' // fallback if not collected
        })
      ]);
    } catch (emailError) {
      console.error('Failed to send confirmation emails:', emailError);
      // Do not crash the redirect, email failure shouldn't prevent success page
    }

    // 4. Redirect to success
    return NextResponse.redirect(new URL('/success', request.url));
    
  } catch (error) {
    console.error('Error verifying Paystack payment:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
