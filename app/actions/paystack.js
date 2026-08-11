'use server';

export async function checkoutAction(cart, customerForm) {
  try {
    if (!cart || cart.length === 0) {
      throw new Error('Cart is empty');
    }

    if (!customerForm || !customerForm.email) {
      throw new Error('Customer information is missing');
    }

    const email = customerForm.email;

    // 2. Calculate amount in Kobo
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const hasFreeShipping = subtotal >= 70000;
    const shippingCost = hasFreeShipping ? 0 : 2500;
    const totalAmount = subtotal + shippingCost;
    const amountInKobo = totalAmount * 100;

    // 3. Prepare Metadata
    const metadata = {
      customerName: customerForm.name,
      customerPhone: customerForm.phone,
      shippingAddress: JSON.stringify({
        address: customerForm.address,
        city: customerForm.city,
      }),
      paymentMethod: customerForm.paymentMethod,
      cart: cart.map(item => ({
        id: item.id,
        title: item.title,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price
      }))
    };

    // 4. Construct callback URL dynamically
    let url = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'http://localhost:3000';
    url = url.includes('http') ? url : `https://${url}`;
    url = url.replace(/\/+$/, '');
    const callback_url = `${url}/api/paystack/verify`;

    // 5. Call Paystack API
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: amountInKobo,
        callback_url: callback_url,
        metadata: metadata,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || 'Failed to initialize Paystack transaction');
    }

    // Return the URL for the client to redirect to
    return { url: result.data.authorization_url };
  } catch (error) {
    console.error('Paystack checkout error:', error);
    throw new Error(error.message);
  }
}
