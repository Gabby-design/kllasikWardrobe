"use server";

import { createAdminClient } from '../lib/supabase';
import { Order } from '../../types';

export async function getOrders(): Promise<Order[]> {
  const adminAuth = createAdminClient();
  const { data, error } = await adminAuth
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }

  return data as Order[];
}

export async function updateOrderDeliveryStatus(orderId: string, newStatus: string): Promise<Order | null> {
  const adminAuth = createAdminClient();
  const { data, error } = await adminAuth
    .from('orders')
    .update({ delivery_status: newStatus })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Update status error:', error);
    return null;
  }

  return data as Order;
}
