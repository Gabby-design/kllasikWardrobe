import { Resend } from 'resend';

export const DEFAULT_OWNER_EMAIL = process.env.OWNER_EMAIL || 'gabrieltolulope50@gmail.com';
export const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'onboarding@resend.dev';

/**
 * Universal email dispatcher supporting Resend and Brevo APIs.
 */
export async function sendEmail({ to, subject, htmlContent, textContent }) {
  const recipients = Array.isArray(to) ? to : [to];
  const validRecipients = recipients.filter(Boolean);

  if (validRecipients.length === 0) {
    console.warn('⚠️ sendEmail: No recipient provided.');
    return { success: false, error: 'No recipient' };
  }

  // 1. Try Resend if API key is present
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && resendKey !== 're_123') {
    try {
      const resend = new Resend(resendKey);
      const res = await resend.emails.send({
        from: process.env.RESEND_FROM || `Klasik Wardrobe <${SENDER_EMAIL}>`,
        to: validRecipients,
        subject: subject,
        html: htmlContent,
        text: textContent || subject,
      });

      if (res.error) {
        console.warn('⚠️ Resend error, attempting fallback if available:', res.error);
      } else {
        console.log('✅ Email successfully dispatched via Resend to:', validRecipients.join(', '));
        return { success: true, provider: 'resend', data: res.data };
      }
    } catch (err) {
      console.warn('⚠️ Resend dispatch error:', err.message);
    }
  }

  // 2. Try Brevo if API key is present
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    try {
      const url = 'https://api.brevo.com/v3/smtp/email';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Klasik Wardrobe', email: SENDER_EMAIL.includes('@') ? SENDER_EMAIL : 'orders@klasic.com' },
          to: validRecipients.map(email => ({ email })),
          subject: subject,
          htmlContent: htmlContent
        })
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log('✅ Email successfully dispatched via Brevo to:', validRecipients.join(', '));
        return { success: true, provider: 'brevo', data };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('⚠️ Brevo API Error:', errorData);
      }
    } catch (err) {
      console.warn('⚠️ Brevo network error:', err.message);
    }
  }

  console.log(`ℹ️ [Email Simulation] To: ${validRecipients.join(', ')} | Subject: ${subject}`);
  return { 
    success: true, 
    simulated: true, 
    message: 'Email logged (configure RESEND_API_KEY or BREVO_API_KEY for live delivery)' 
  };
}

/**
 * Sends a detailed order notification to the store owner (gabrieltolulope50@gmail.com).
 */
export async function sendOwnerOrderNotification({
  orderId = '',
  items = [],
  customer = {},
  totalAmount = 0,
  subtotal = 0,
  shippingCost = 0,
  ownerEmail = DEFAULT_OWNER_EMAIL
}) {
  const targetOwnerEmail = ownerEmail || DEFAULT_OWNER_EMAIL;
  const orderRef = orderId ? `#${String(orderId).slice(0, 8).toUpperCase()}` : `#KLASIK-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedTotal = Number(totalAmount || 0).toLocaleString();
  const cleanPhone = String(customer.phone || '').replace(/[^0-9]/g, '');
  const customerWhatsAppLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone}` : null;

  // Build items rows
  const itemsRows = items && items.length > 0
    ? items.map((item, idx) => {
        const itemQty = Number(item.quantity || 1);
        const itemPrice = Number(item.price || 0);
        const itemTotal = (itemPrice * itemQty).toLocaleString();
        return `
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 14px 10px; vertical-align: top;">
              <strong style="color: #121212; font-size: 14px; display: block;">${item.title || item.name || 'Luxury Garment'}</strong>
              <span style="color: #666; font-size: 12px;">Size: <strong>${item.size || 'L'}</strong> | Color: <strong>${item.color || 'Standard'}</strong></span>
            </td>
            <td style="padding: 14px 10px; text-align: center; color: #121212; font-weight: 600; font-size: 13px;">${itemQty}</td>
            <td style="padding: 14px 10px; text-align: right; color: #666; font-size: 13px;">₦${itemPrice.toLocaleString()}</td>
            <td style="padding: 14px 10px; text-align: right; color: #121212; font-weight: bold; font-size: 14px;">₦${itemTotal}</td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="4" style="padding: 16px; text-align: center; color: #888;">No items detailed</td></tr>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Alert</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f5f4f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #121212;">
      <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border-radius: 4px; overflow: hidden;">
        
        <!-- Header Banner -->
        <div style="background: #121212; padding: 28px 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 18px; letter-spacing: 0.25em; text-transform: uppercase; font-weight: 800; color: #ffffff;">KLASIK WARDROBE</h1>
          <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #d4af37;">Luxury Streetwear & Essentials</p>
        </div>

        <!-- Notification Tag -->
        <div style="background: #eef8f1; border-bottom: 1px solid #d1ebd8; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 12px; font-weight: bold; color: #1e7e34; text-transform: uppercase; letter-spacing: 0.1em;">
            🚨 NEW ORDER PLACED (${orderRef})
          </span>
          <span style="font-size: 11px; color: #555;">${dateStr}</span>
        </div>

        <div style="padding: 24px;">
          
          <!-- Big Highlight Total -->
          <div style="background: #faf9f6; border: 1px solid #e8e6df; padding: 18px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #777; display: block; margin-bottom: 4px;">Total Transaction Value</span>
            <span style="font-size: 28px; font-weight: 800; color: #121212; letter-spacing: -0.02em;">₦${formattedTotal}</span>
            <div style="margin-top: 6px;">
              <span style="display: inline-block; background: #fff3cd; color: #856404; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 3px 8px; border-radius: 2px;">
                Pending Bank Transfer Verification
              </span>
            </div>
          </div>

          <!-- Customer & Location Details Grid -->
          <div style="border: 1px solid #ebebeb; margin-bottom: 24px;">
            <div style="background: #f9f9f9; padding: 10px 16px; border-bottom: 1px solid #ebebeb; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #333;">
              📍 Customer & Delivery Location
            </div>
            <div style="padding: 16px; font-size: 13px; line-height: 1.6;">
              <div style="margin-bottom: 8px;">
                <strong style="color: #666; font-size: 11px; text-transform: uppercase; display: block;">Recipient Name</strong>
                <span style="font-size: 14px; font-weight: 600; color: #121212;">${customer.name || 'Valued Customer'}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #666; font-size: 11px; text-transform: uppercase; display: block;">Contact Phone</strong>
                <a href="tel:${customer.phone}" style="color: #121212; font-weight: 600; text-decoration: none;">${customer.phone || 'Not Provided'}</a>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #666; font-size: 11px; text-transform: uppercase; display: block;">Email Address</strong>
                <a href="mailto:${customer.email}" style="color: #121212; text-decoration: underline;">${customer.email || 'Not Provided'}</a>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #666; font-size: 11px; text-transform: uppercase; display: block;">Delivery Street Address</strong>
                <span style="color: #121212; font-weight: 500;">${customer.address || 'Address not provided'}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #666; font-size: 11px; text-transform: uppercase; display: block;">City / State / Region</strong>
                <span style="color: #121212; font-weight: 600;">${customer.city || 'Lagos'} (${customer.city === 'Lagos' ? 'Express Courier: 24–48 Hours' : 'Interstate Dispatch: 2–4 Business Days'})</span>
              </div>
              ${customer.notes ? `
                <div style="margin-top: 8px; padding: 8px 12px; background: #fffbe6; border-left: 3px solid #ffe58f;">
                  <strong style="font-size: 11px; color: #874d00; text-transform: uppercase; display: block;">Special Instructions / Landmark:</strong>
                  <span style="font-size: 12px; color: #595959;">${customer.notes}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Items Purchased Table -->
          <div style="border: 1px solid #ebebeb; margin-bottom: 24px;">
            <div style="background: #f9f9f9; padding: 10px 16px; border-bottom: 1px solid #ebebeb; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #333;">
              📦 Purchased Items (${items.reduce((s, i) => s + (i.quantity || 1), 0)} Total)
            </div>
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background: #fafafa; border-bottom: 1px solid #eee; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #777;">
                  <th style="padding: 10px;">Item / Specifications</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Unit Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <!-- Financial Summary -->
          <div style="background: #fafafa; border: 1px solid #ebebeb; padding: 16px; margin-bottom: 24px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #555;">
              <span>Subtotal:</span>
              <span>₦${Number(subtotal || totalAmount).toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #555;">
              <span>Delivery Fee:</span>
              <span>${shippingCost === 0 ? 'FREE (Over ₦70k Order)' : `₦${Number(shippingCost).toLocaleString()}`}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #555;">
              <span>Packaging:</span>
              <span style="color: #2b8a3e; font-weight: 600;">Complimentary Luxury Dust Box</span>
            </div>
            <div style="border-top: 1px solid #e0e0e0; padding-top: 10px; display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; color: #121212;">
              <span>TOTAL ORDER VALUE:</span>
              <span>₦${formattedTotal}</span>
            </div>
          </div>

          <!-- Quick Owner Action Buttons -->
          <div style="text-align: center; padding-top: 10px;">
            ${customerWhatsAppLink ? `
              <a href="${customerWhatsAppLink}" style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 3px; margin: 4px;">
                💬 Message Buyer on WhatsApp
              </a>
            ` : ''}
            <a href="tel:${customer.phone}" style="display: inline-block; background: #121212; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 3px; margin: 4px;">
              📞 Call Buyer (${customer.phone})
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #f0efe9; padding: 16px 24px; text-align: center; font-size: 11px; color: #777; border-top: 1px solid #e3e1d8;">
          Klasik Wardrobe Automation • Notification delivered to <strong>${targetOwnerEmail}</strong>
        </div>

      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: targetOwnerEmail,
    subject: `🚨 NEW ORDER RECEIVED: ${orderRef} — ₦${formattedTotal} (${customer.name || 'Customer'} - ${customer.city || 'Lagos'})`,
    htmlContent
  });
}

/**
 * Sends customer order confirmation receipt.
 */
export async function sendCustomerReceipt({
  orderId = '',
  items = [],
  customer = {},
  totalAmount = 0,
  subtotal = 0,
  shippingCost = 0
}) {
  if (!customer.email) return { skipped: true };

  const orderRef = orderId ? `#${String(orderId).slice(0, 8).toUpperCase()}` : `#KLASIK-${Date.now().toString().slice(-6)}`;
  const formattedTotal = Number(totalAmount || 0).toLocaleString();

  const itemsList = items && items.length > 0
    ? items.map(item => `
        <li style="margin-bottom: 8px;">
          <strong>${item.title || item.name}</strong> (${item.size || 'L'} / ${item.color || 'Standard'}) × ${item.quantity || 1} — ₦${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
        </li>
      `).join('')
    : '<li>Your selected luxury garments</li>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Order Receipt</title></head>
    <body style="margin:0; padding:20px; background-color:#f9f8f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#121212;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e8e6e1; padding:32px;">
        <h1 style="font-size:18px; letter-spacing:0.2em; text-transform:uppercase; margin:0 0 16px 0; border-bottom:1px solid #eee; padding-bottom:16px;">KLASIK WARDROBE</h1>
        <h2 style="font-size:16px; margin:0 0 12px 0;">Thank you for your order, ${customer.name || 'Valued Client'}!</h2>
        <p style="font-size:13px; color:#555; line-height:1.6;">Your luxury order <strong>${orderRef}</strong> has been received. Our dispatch team is preparing your package.</p>
        
        <h3 style="font-size:13px; text-transform:uppercase; letter-spacing:0.1em; margin:24px 0 8px 0; color:#333;">Order Items</h3>
        <ul style="font-size:13px; color:#333; padding-left:20px; line-height:1.6;">
          ${itemsList}
        </ul>

        <div style="background:#faf9f6; padding:16px; margin:20px 0; border:1px solid #eee; font-size:13px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>Subtotal:</span>
            <span>₦${Number(subtotal || totalAmount).toLocaleString()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
            <span>Delivery:</span>
            <span>${shippingCost === 0 ? 'FREE' : `₦${Number(shippingCost).toLocaleString()}`}</span>
          </div>
          <div style="border-top:1px solid #ddd; padding-top:8px; font-weight:bold; font-size:14px;">
            TOTAL PAID / DUE: ₦${formattedTotal}
          </div>
        </div>

        <p style="font-size:12px; color:#777; margin-top:30px;">
          Need assistance or custom styling? Reply directly or message our WhatsApp Concierge at <strong>07075039738</strong>.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customer.email,
    subject: `Order Receipt ${orderRef} — Klasik Wardrobe`,
    htmlContent
  });
}
