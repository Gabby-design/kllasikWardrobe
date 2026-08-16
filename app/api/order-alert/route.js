import { NextResponse } from 'next/server';
import { sendEmail, DEFAULT_OWNER_EMAIL } from '../../../lib/email';

export async function POST(req) {
  try {
    const { name, price, size, color, customerName, customerPhone, address, city } = await req.json();

    await sendEmail({
      to: process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL,
      subject: `🚨 New Order: ${name} (₦${Number(price || 0).toLocaleString()})`,
      htmlContent: `
        <div style="font-family: sans-serif; padding: 20px; color: #121212;">
          <h2>👑 Klasik Wardrobe - New Order Alert</h2>
          <p><strong>Item:</strong> ${name} ${size ? `(${size})` : ''} ${color ? `[${color}]` : ''}</p>
          <p><strong>Price:</strong> ₦${Number(price || 0).toLocaleString()}</p>
          ${customerName ? `<p><strong>Customer:</strong> ${customerName}</p>` : ''}
          ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
          ${address ? `<p><strong>Delivery Address:</strong> ${address}, ${city || 'Lagos'}</p>` : ''}
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send alert:', error);
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 });
  }
}
