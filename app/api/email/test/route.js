import { NextResponse } from 'next/server';
import { sendOwnerOrderNotification, DEFAULT_OWNER_EMAIL } from '../../../../lib/email';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetEmail = searchParams.get('to') || process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL;

    // Check which providers are configured
    const configuredProviders = {
      resend: Boolean(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('your_') && process.env.RESEND_API_KEY !== 're_123'),
      brevo: Boolean(process.env.BREVO_API_KEY && !process.env.BREVO_API_KEY.startsWith('your_')),
      smtp: Boolean((process.env.GMAIL_USER || process.env.SMTP_USER) && (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS)),
      targetOwnerEmail: targetEmail
    };

    // Dispatch a test alert
    const result = await sendOwnerOrderNotification({
      orderId: 'TEST-' + Math.floor(100000 + Math.random() * 900000),
      items: [
        {
          title: 'Signature Classic Oversized Hoodie (TEST EMAIL)',
          size: 'XL',
          color: 'Washed Black',
          price: 35000,
          quantity: 1
        }
      ],
      customer: {
        name: 'Gabriel Tolulope (Test Order)',
        email: targetEmail,
        phone: '07075039738',
        address: '14 Admiralty Way, Lekki Phase 1',
        city: 'Lagos',
        notes: 'Test dispatch to verify email delivery setup'
      },
      totalAmount: 35000,
      subtotal: 35000,
      shippingCost: 0,
      ownerEmail: targetEmail
    });

    return NextResponse.json({
      status: 'Test execution complete',
      providersConfigured: configuredProviders,
      dispatchResult: result,
      instructions: !result.success ? [
        'To receive real emails in your Gmail inbox:',
        '1. Get a free API key from Resend (https://resend.com) -> add RESEND_API_KEY to your environment variables.',
        'OR 2. Get a free API key from Brevo (https://brevo.com) -> add BREVO_API_KEY to your environment variables.',
        'OR 3. Add GMAIL_USER (gabrieltolulope50@gmail.com) and GMAIL_APP_PASSWORD (16-char app password from Google Security) to your environment variables.'
      ] : 'Email dispatched successfully!'
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message || 'Error executing email test'
    }, { status: 500 });
  }
}
