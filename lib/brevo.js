export async function sendBrevoEmail({ to, subject, htmlContent }) {
  const url = 'https://api.brevo.com/v3/smtp/email';
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || 'hello@klasic.com';

  const body = {
    sender: { name: 'Klasik Wardrobe', email: senderEmail },
    to: to.map(email => ({ email })),
    subject: subject,
    htmlContent: htmlContent
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Brevo API Error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data;
}

export async function sendBuyerReceipt({ buyerEmail, buyerName, orderDetails, totalAmount }) {
  const htmlContent = `
    <div style="font-family: 'DM Sans', sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; background-color: #f8f8f8; padding: 40px;">
      <h1 style="font-family: 'Syne', serif; text-transform: uppercase; letter-spacing: -0.02em; border-bottom: 1px solid #e0e0e0; padding-bottom: 20px;">Order Confirmation</h1>
      <p>Hi ${buyerName || 'there'},</p>
      <p>Thank you for your purchase from Klasik Wardrobe. Your luxury pieces are being prepared.</p>
      
      <h3 style="margin-top: 30px;">Order Details</h3>
      <div style="background-color: #ffffff; padding: 20px; border: 1px solid #eaeaea;">
        ${orderDetails}
      </div>
      
      <h3 style="margin-top: 20px;">Total Paid: ₦${totalAmount}</h3>
      
      <p style="margin-top: 40px; font-size: 12px; color: #666;">
        Klasik Wardrobe<br/>
        Elevating Everyday Essentials.
      </p>
    </div>
  `;

  return sendBrevoEmail({
    to: [buyerEmail],
    subject: `Your Klasik Wardrobe Order Receipt`,
    htmlContent
  });
}

export async function sendOwnerNotification({ ownerEmail, buyerEmail, buyerName, orderDetails, totalAmount, shippingAddress }) {
  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>🚨 NEW ORDER RECEIVED</h2>
      <p><strong>Buyer:</strong> ${buyerName || 'N/A'} (${buyerEmail})</p>
      <p><strong>Total Amount:</strong> ₦${totalAmount}</p>
      ${shippingAddress ? `<p><strong>Shipping Address:</strong> ${shippingAddress}</p>` : ''}
      
      <h3>Order Items:</h3>
      <div>${orderDetails}</div>
    </div>
  `;

  return sendBrevoEmail({
    to: [ownerEmail],
    subject: `🚨 NEW ORDER RECEIVED - ₦${totalAmount}`,
    htmlContent
  });
}

export async function sendShippingNotification({ buyerEmail, buyerName, orderId, shippingAddress }) {
  const parsedAddress = typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress;
  const addressString = parsedAddress ? `${parsedAddress.address}, ${parsedAddress.city}` : 'N/A';

  const htmlContent = `
    <div style="font-family: 'DM Sans', sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; background-color: #f8f8f8; padding: 40px;">
      <h1 style="font-family: 'Syne', serif; text-transform: uppercase; letter-spacing: -0.02em; border-bottom: 1px solid #e0e0e0; padding-bottom: 20px;">Order Shipped!</h1>
      <p>Hi ${buyerName || 'there'},</p>
      <p>Great news! Your Klasik Wardrobe order (<strong>#${orderId.split('-')[0]}</strong>) has been shipped and is on its way to you.</p>
      
      <h3 style="margin-top: 30px;">Shipping To:</h3>
      <div style="background-color: #ffffff; padding: 20px; border: 1px solid #eaeaea;">
        <p style="margin: 0;">${addressString}</p>
      </div>
      
      <p style="margin-top: 30px;">Please ensure someone is available to receive the package. If you chose Pay on Delivery, please have the exact amount ready.</p>
      
      <p style="margin-top: 40px; font-size: 12px; color: #666;">
        Klasik Wardrobe<br/>
        Elevating Everyday Essentials.
      </p>
    </div>
  `;

  return sendBrevoEmail({
    to: [buyerEmail],
    subject: `Great news! Your Klasik Wardrobe order has shipped 📦`,
    htmlContent
  });
}
