'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../utils/supabase/admin'
import { createClient } from '../../utils/supabase/server'

export async function updateDeliveryStatus(orderId, newStatus) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.email !== process.env.OWNER_EMAIL) {
      return { error: 'Unauthorized' }
    }

    const adminAuth = createAdminClient()
    const { data: orderData, error } = await adminAuth
      .from('orders')
      .update({ delivery_status: newStatus })
      .eq('id', orderId)
      .select()
      .single()
      
    if (error) {
      console.error('Update status error:', error)
      return { error: 'Failed to update delivery status' }
    }

    if (newStatus === 'Shipped' && orderData) {
      // Send email asynchronously so it doesn't block the UI
      import('../../lib/brevo').then(({ sendShippingNotification }) => {
        const parsedAddress = typeof orderData.shipping_address === 'string' 
          ? JSON.parse(orderData.shipping_address) 
          : orderData.shipping_address;
        
        const customerName = parsedAddress?.name || 'Customer';
        const customerEmail = parsedAddress?.email;
        
        if (customerEmail) {
          sendShippingNotification({
            buyerEmail: customerEmail,
            buyerName: customerName,
            orderId: orderData.id,
            shippingAddress: orderData.shipping_address
          }).catch(err => console.error('Failed to send shipping email:', err));
        }
      }).catch(err => console.error('Failed to import brevo:', err));
    }
    
    revalidatePath('/admin')
    revalidatePath('/account')
    return { success: true }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { error: 'An unexpected error occurred' }
  }
}
