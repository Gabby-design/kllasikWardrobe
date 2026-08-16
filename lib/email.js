import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export const DEFAULT_OWNER_EMAIL = process.env.OWNER_EMAIL || 'gabrieltolulope50@gmail.com';
export const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'onboarding@resend.dev';

/**
 * Universal multi-channel email dispatcher supporting:
 * 1. Resend API (RESEND_API_KEY)
 * 2. Brevo REST API (BREVO_API_KEY)
 * 3. Gmail / SMTP (GMAIL_USER + GMAIL_APP_PASSWORD or SMTP_HOST/SMTP_USER/SMTP_PASS)
 */
export async function sendEmail({ to, subject, htmlContent, textContent }) {
  const recipients = Array.isArray(to) ? to : [to];
  const validRecipients = recipients.filter(Boolean);

  if (validRecipients.length === 0) {
    console.warn('⚠️ sendEmail: No recipient provided.');
    return { success: false, error: 'No recipient' };
  }

  let lastError = null;

  // 1. Method A: Resend API
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && resendKey !== 're_123' && !resendKey.startsWith('your_')) {
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
        console.warn('⚠️ Resend API returned error:', res.error);
        lastError = res.error;
      } else {
        console.log('✅ Email successfully dispatched via Resend to:', validRecipients.join(', '));
        return { success: true, provider: 'resend', data: res.data };
      }
    } catch (err) {
      console.warn('⚠️ Resend exception:', err.message);
      lastError = err.message;
    }
  }

  // 2. Method B: Brevo REST API
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey && !brevoKey.startsWith('your_')) {
    try {
      const url = 'https://api.brevo.com/v3/smtp/email';
      const senderFrom = process.env.SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'orders@klasic.com';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Klasik Wardrobe', email: senderFrom },
          to: validRecipients.map(email => ({ email })),
          subject: subject,
          htmlContent: htmlContent,
          textContent: textContent || subject
        })
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log('✅ Email successfully dispatched via Brevo to:', validRecipients.join(', '));
        return { success: true, provider: 'brevo', data };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('⚠️ Brevo API Error:', errorData);
        lastError = errorData;
      }
    } catch (err) {
      console.warn('⚠️ Brevo network error:', err.message);
      lastError = err.message;
    }
  }

  // 3. Method C: Direct Gmail / SMTP Transport via Nodemailer
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: Number(process.env.SMTP_PORT || 465) === 465,
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Klasik Wardrobe" <${gmailUser}>`,
        to: validRecipients.join(', '),
        subject: subject,
        text: textContent || subject,
        html: htmlContent,
      });

      console.log('✅ Email successfully dispatched via SMTP/Gmail to:', validRecipients.join(', '), 'MessageId:', info.messageId);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (smtpErr) {
      console.warn('⚠️ SMTP dispatch error:', smtpErr.message);
      lastError = smtpErr.message;
    }
  }

  // Fallback: If no API key configured, log informative notice
  console.log('ℹ️ [Email Simulation/Pending Keys]');
  console.log(`- To: ${validRecipients.join(', ')}`);
  console.log(`- Subject: ${subject}`);
  console.log(`- Note: To receive live emails in Gmail, please set RESEND_API_KEY, BREVO_API_KEY, or GMAIL_APP_PASSWORD in .env.local and Vercel settings.`);

  return { 
    success: false, 
    simulated: true, 
    error: lastError || 'No active email provider API key configured (set RESEND_API_KEY or BREVO_API_KEY in .env.local)',
    target: validRecipients.join(', ')
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
            <div style="padding: 16px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #666; width: 140px;">Customer Name:</td>
                  <td style="padding: 6px 0; color: #121212; font-weight: 600;">${customer.name || 'Valued Customer'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;">Phone Number:</td>
                  <td style="padding: 6px 0; color: #121212; font-weight: 600;">
                    <a href="tel:${customer.phone}" style="color: #121212; text-decoration: none;">${customer.phone || 'N/A'}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;">Email Address:</td>
                  <td style="padding: 6px 0; color: #121212;">
                    <a href="mailto:${customer.email}" style="color: #0066cc; text-decoration: none;">${customer.email || 'N/A'}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;">Delivery Address:</td>
                  <td style="padding: 6px 0; color: #121212; font-weight: 600;">${customer.address || 'Standard Delivery'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666;">City / Region:</td>
                  <td style="padding: 6px 0; color: #121212; font-weight: 600;">${customer.city || 'Lagos'}, Nigeria</td>
                </tr>
                ${customer.notes ? `
                <tr>
                  <td style="padding: 6px 0; color: #e65100; font-weight: 600;">Delivery Notes:</td>
                  <td style="padding: 6px 0; color: #e65100; font-style: italic;">"${customer.notes}"</td>
                </tr>
                ` : ''}
              </table>
            </div>
          </div>

          <!-- Quick Action Buttons for Owner -->
          <div style="margin-bottom: 24px; text-align: center;">
            ${customerWhatsAppLink ? `
              <a href="${customerWhatsAppLink}" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 12px 22px; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 4px; margin-right: 8px; margin-bottom: 8px;">
                💬 Message Buyer on WhatsApp
              </a>
            ` : ''}
            ${customer.phone ? `
              <a href="tel:${customer.phone}" style="display: inline-block; background-color: #121212; color: #ffffff; padding: 12px 22px; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 4px; margin-bottom: 8px;">
                📞 Call Buyer (${customer.phone})
              </a>
            ` : ''}
          </div>

          <!-- Itemized Purchase List -->
          <div style="border: 1px solid #ebebeb; margin-bottom: 24px;">
            <div style="background: #f9f9f9; padding: 10px 16px; border-bottom: 1px solid #ebebeb; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #333;">
              🛍️ Purchased Items (${items ? items.length : 0})
            </div>
            <div style="padding: 10px 16px;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #e5e5e0; font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.1em;">
                    <th style="padding: 8px 10px; text-align: left;">Item</th>
                    <th style="padding: 8px 10px; text-align: center;">Qty</th>
                    <th style="padding: 8px 10px; text-align: right;">Unit</th>
                    <th style="padding: 8px 10px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Pricing Summary -->
              <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #eee; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #666;">
                  <span>Subtotal:</span>
                  <span>₦${Number(subtotal || totalAmount).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #666;">
                  <span>Courier Delivery:</span>
                  <span>${shippingCost === 0 ? '<strong style="color:#1e7e34;">FREE</strong>' : `₦${Number(shippingCost).toLocaleString()}`}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0 0 0; border-top: 1px solid #121212; font-size: 15px; font-weight: bold; color: #121212;">
                  <span>Total Due:</span>
                  <span>₦${formattedTotal}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Dispatch Checklist -->
          <div style="background: #fdfdfc; border: 1px dashed #cccccc; padding: 14px 18px; font-size: 12px; color: #555;">
            <strong style="color: #121212; display: block; margin-bottom: 4px;">Next Operational Steps:</strong>
            1. Verify the customer's transfer alert of <strong>₦${formattedTotal}</strong>.<br/>
            2. Match payment proof sent via WhatsApp or bank notification.<br/>
            3. Package items with official dust covers and dispatch courier.
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #f5f4f0; padding: 18px 24px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #e5e5e0;">
          Klasik Wardrobe Operations &bull; Automated Concierge Dispatch<br/>
          Direct notification to store owner: <a href="mailto:${targetOwnerEmail}" style="color: #666;">${targetOwnerEmail}</a>
        </div>

      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: [targetOwnerEmail],
    subject: `🚨 NEW ORDER #${String(orderId).slice(0, 8).toUpperCase()} - ₦${formattedTotal} from ${customer.name || 'Buyer'}`,
    htmlContent,
    textContent: `New order ${orderRef} placed by ${customer.name || 'Customer'} (${customer.phone || 'No phone'}). Total: ₦${formattedTotal}. Delivery to ${customer.address || 'Address'}, ${customer.city || 'Lagos'}.`
  });
}

/**
 * Sends a luxury purchase receipt directly to the customer.
 */
export async function sendCustomerReceipt({
  orderId = '',
  items = [],
  customer = {},
  totalAmount = 0,
  subtotal = 0,
  shippingCost = 0
}) {
  if (!customer.email) {
    return { success: false, message: 'No customer email provided' };
  }

  const orderRef = orderId ? `#${String(orderId).slice(0, 8).toUpperCase()}` : `#KLASIK-${Date.now().toString().slice(-6)}`;
  const formattedTotal = Number(totalAmount || 0).toLocaleString();

  const itemsRows = items && items.length > 0
    ? items.map(item => `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 12px 8px; color: #121212; font-size: 13px;">
            <strong>${item.title || item.name}</strong><br/>
            <span style="color: #777; font-size: 11px;">Size ${item.size || 'L'} &bull; ${item.color || 'Standard'}</span>
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #121212; font-size: 13px;">${item.quantity || 1}</td>
          <td style="padding: 12px 8px; text-align: right; color: #121212; font-weight: bold; font-size: 13px;">
            ₦${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
          </td>
        </tr>
      `).join('')
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Klasik Wardrobe Receipt</title></head>
    <body style="margin: 0; padding: 20px; background-color: #faf9f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #121212;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e8e6df; padding: 32px;">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 20px; letter-spacing: 0.25em; text-transform: uppercase; font-weight: 800;">KLASIK WARDROBE</h1>
          <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #888;">Order Confirmation & Receipt</p>
        </div>

        <div style="padding: 24px 0;">
          <p style="font-size: 15px; margin: 0 0 12px 0;">Hi <strong>${customer.name || 'Valued Client'}</strong>,</p>
          <p style="font-size: 13px; color: #555; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for shopping with Klasik Wardrobe. Your order record <strong>${orderRef}</strong> has been registered with our dispatch desk.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 2px solid #121212; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #555;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="background: #f9f9f9; padding: 16px; font-size: 13px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #666;">
              <span>Subtotal:</span>
              <span>₦${Number(subtotal || totalAmount).toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #666;">
              <span>Delivery Fee:</span>
              <span>${shippingCost === 0 ? 'FREE' : `₦${Number(shippingCost).toLocaleString()}`}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #121212; border-top: 1px solid #ddd; padding-top: 8px;">
              <span>Total:</span>
              <span>₦${formattedTotal}</span>
            </div>
          </div>

          <div style="border-left: 3px solid #121212; padding-left: 12px; font-size: 12px; color: #666; margin-bottom: 24px;">
            <strong>Delivering to:</strong><br/>
            ${customer.address || 'Address'}, ${customer.city || 'Lagos'}, Nigeria<br/>
            Contact: ${customer.phone || 'N/A'}
          </div>

          <div style="text-align: center; padding: 16px; background: #faf8f5; border: 1px solid #ebe7df;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #555;">Need assistance or real-time delivery update?</p>
            <a href="https://wa.me/2347075039738" style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; text-decoration: none; font-size: 12px; font-weight: bold; border-radius: 3px;">
              Chat With Concierge on WhatsApp
            </a>
          </div>
        </div>

        <div style="text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px;">
          Klasik Wardrobe &bull; Elevating Everyday Luxury Essentials
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: [customer.email],
    subject: `Your Klasik Wardrobe Order Confirmation (${orderRef})`,
    htmlContent,
    textContent: `Hi ${customer.name}, your Klasik Wardrobe order ${orderRef} of ₦${formattedTotal} is being processed.`
  });
}
