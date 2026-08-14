'use server';

import { createAdminClient } from '../../utils/supabase/admin';
import { sendBrevoEmail } from '../../lib/brevo';
import { revalidatePath } from 'next/cache';

export async function confirmPayment(orderId) {
  try {
    const supabase = createAdminClient();
    
    // 1. Fetch the order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      throw new Error('Order not found');
    }

    // 2. Update payment_status to 'Paid'
    const { error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: 'Paid' })
      .eq('id', orderId);

    if (updateError) {
      throw new Error('Failed to update payment status');
    }

    // 3. Send Payment Confirmation Receipt via Brevo
    let parsedAddress = {};
    if (typeof order.shipping_address === 'string') {
      try {
        parsedAddress = JSON.parse(order.shipping_address);
      } catch (e) {
        // ignore
      }
    } else if (order.shipping_address) {
      parsedAddress = order.shipping_address;
    }

    const buyerEmail = parsedAddress.email;
    const buyerName = parsedAddress.name || 'Customer';
    const amountInNaira = (order.total_amount || 0).toLocaleString();

    if (buyerEmail) {
      const productsSummary = (order.items || []).map(item => {
        return `<p>- ${item.title} - ${item.size} (${item.color}) (Qty: ${item.quantity})</p>`;
      }).join('');

      const htmlContent = `
        <div style="font-family: 'DM Sans', sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; background-color: #f8f8f8; padding: 40px;">
          <h1 style="font-family: 'Syne', serif; text-transform: uppercase; letter-spacing: -0.02em; border-bottom: 1px solid #e0e0e0; padding-bottom: 20px;">Payment Confirmed</h1>
          <p>Hi ${buyerName},</p>
          <p>Great news! We have successfully received your bank transfer for order <strong>#${orderId.split('-')[0]}</strong>.</p>
          <p>Your order is now being processed and your luxury pieces are being prepared for dispatch.</p>
          
          <h3 style="margin-top: 30px;">Order Details</h3>
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #eaeaea;">
            ${productsSummary}
          </div>
          
          <h3 style="margin-top: 20px;">Total Paid: ₦${amountInNaira}</h3>
          
          <p style="margin-top: 40px; font-size: 12px; color: #666;">
            Klasik Wardrobe<br/>
            Elevating Everyday Essentials.
          </p>
        </div>
      `;

      try {
        await sendBrevoEmail({
          to: [buyerEmail],
          subject: 'Payment Confirmed - Your Klasik Wardrobe Order',
          htmlContent
        });
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
      }
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('confirmPayment error:', error);
    throw new Error(error.message);
  }
}
