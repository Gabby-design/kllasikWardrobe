import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '../../../../utils/supabase/server';

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
    const supabase = await createClient();
    
    // We attempt to insert into 'orders' table. 
    await supabase
      .from('orders')
      .insert([
        {
          email: customerEmail,
          amount: amount / 100,
          reference: reference,
          items: cart,
          status: 'paid'
        }
      ]);

    // 3. Send Confirmation Email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY || 're_123');
    
    const productsSummary = cart.map(item => {
      return `- ${item.title} - ${item.size} (${item.color}) (Qty: ${item.quantity})`;
    }).join('<br>');

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'gabrieltolulope50@gmail.com',
      subject: `[Klasik] New Order Received! (₦${amountInNaira})`,
      html: `
        <p><strong>New Order Alert!</strong></p>
        <p>A customer just completed a checkout session via Paystack.</p>
        <p><strong>Customer Email:</strong> ${customerEmail}</p>
        <p><strong>Total Amount:</strong> ₦${amountInNaira}</p>
        <p><strong>Products Ordered:</strong><br>${productsSummary || 'No items found in metadata.'}</p>
        <p><strong>Paystack Reference:</strong> ${reference}</p>
      `,
    });

    // 4. Redirect to success
    return NextResponse.redirect(new URL('/?success=true', request.url));
    
  } catch (error) {
    console.error('Error verifying Paystack payment:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
