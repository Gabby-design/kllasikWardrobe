import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/admin';
import { sendOwnerOrderNotification, sendCustomerReceipt, DEFAULT_OWNER_EMAIL } from '../../../../lib/email';

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

    // 3. Send Confirmation Emails
    try {
      const parsedAddress = typeof metadata?.shippingAddress === 'string' 
        ? JSON.parse(metadata.shippingAddress) 
        : (metadata?.shippingAddress || {});

      await Promise.allSettled([
        sendOwnerOrderNotification({
          orderId: reference,
          items: cart,
          customer: {
            name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || parsedAddress.name || 'Paystack Customer',
            email: customerEmail,
            phone: customer.phone || parsedAddress.phone || '',
            address: parsedAddress.address || '',
            city: parsedAddress.city || 'Lagos'
          },
          totalAmount: amount / 100,
          subtotal: amount / 100,
          shippingCost: 0,
          ownerEmail: process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL
        }),
        sendCustomerReceipt({
          orderId: reference,
          items: cart,
          customer: {
            name: customer.first_name || parsedAddress.name || 'Valued Customer',
            email: customerEmail,
            phone: customer.phone || parsedAddress.phone || '',
            address: parsedAddress.address || '',
            city: parsedAddress.city || 'Lagos'
          },
          totalAmount: amount / 100,
          subtotal: amount / 100,
          shippingCost: 0
        })
      ]);
    } catch (emailError) {
      console.error('Failed to send confirmation emails:', emailError);
    }

    // 4. Redirect to success
    return NextResponse.redirect(new URL('/success', request.url));
    
  } catch (error) {
    console.error('Error verifying Paystack payment:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
