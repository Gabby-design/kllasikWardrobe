/**
 * Utility for generating formatted WhatsApp order messages and direct chat links.
 */

export const DEFAULT_WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '2347075039738';

export function formatWhatsAppOrderMessage({
  orderId = '',
  items = [],
  customer = {},
  totalAmount = 0,
  subtotal = 0,
  shippingCost = 0,
  isFreeShipping = false,
  bankDetails = {}
}) {
  const itemsText = items && items.length > 0
    ? items.map((item, index) => {
        const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
        return `${index + 1}. *${item.title || item.name}*\n   • Size: ${item.size || 'L'} | Color: ${item.color || 'Standard'}\n   • Qty: ${item.quantity || 1} × ₦${Number(item.price || 0).toLocaleString()} = ₦${itemTotal.toLocaleString()}`;
      }).join('\n\n')
    : '• No items listed';

  const orderRef = orderId ? `#${orderId}` : `#KLASIK-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const message = `👑 *KLASIK WARDROBE — ORDER NOTIFICATION*
━━━━━━━━━━━━━━━━━━━━━━
📋 *Order Ref:* ${orderRef}
📅 *Date:* ${dateStr}

👤 *CUSTOMER DETAILS*
• *Name:* ${customer.name || 'Valued Customer'}
• *Phone:* ${customer.phone || 'Not Provided'}
• *Email:* ${customer.email || 'Not Provided'}

📍 *DELIVERY ADDRESS*
• *Address:* ${customer.address || 'Address not specified'}
• *City / Region:* ${customer.city || 'Lagos'}
• *Delivery Service:* Express Courier (${customer.city === 'Lagos' ? '24–48h' : '2–4 Days'})
${customer.notes ? `• *Special Notes:* ${customer.notes}\n` : ''}
📦 *PURCHASED PRODUCTS (${items.reduce((s, i) => s + (i.quantity || 1), 0)} items)*
${itemsText}

💰 *PAYMENT BREAKDOWN*
• *Items Subtotal:* ₦${Number(subtotal || totalAmount).toLocaleString()}
• *Delivery Fee:* ${isFreeShipping || shippingCost === 0 ? 'FREE (Over ₦70,000)' : `₦${Number(shippingCost).toLocaleString()}`}
• *Luxury Dust Box:* COMPLIMENTARY
• *TOTAL DUE / PAID:* *₦${Number(totalAmount).toLocaleString()}*

🏦 *BANK TRANSFERRED TO*
• *Bank:* ${bankDetails.bankName || 'OPay / Paycom'}
• *Account Name:* ${bankDetails.accountName || 'KLASIK WARDROBE'}
• *Account Number:* ${bankDetails.accountNumber || '7075039738'}

━━━━━━━━━━━━━━━━━━━━━━
✅ *I have made the bank transfer for this order. Please confirm payment and proceed with packaging & dispatch.*`;

  return message;
}

export function getWhatsAppOrderLink(orderData, phoneNumber = DEFAULT_WHATSAPP_PHONE) {
  const cleanPhone = String(phoneNumber).replace(/[^0-9]/g, '');
  const message = formatWhatsAppOrderMessage(orderData);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
