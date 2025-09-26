import { supabase } from './supabase';

export interface Purchase {
  id: number;
  checkout_session_id: string;
  payment_intent_id: string;
  customer_id: string;
  amount_total: number;
  currency: string;
  payment_status: string;
  status: string;
  created_at: string;
}

// Check if user has purchased the one-off cusp reading
export async function hasOneOffReading(): Promise<boolean> {
  try {
    const { getCurrentUser } = await import('./auth');
    const authUser = await getCurrentUser();
    
    if (!authUser) {
      return false;
    }

    // Check if user has any completed one-time purchases
    const { data: orders } = await supabase
      .from('stripe_user_orders')
      .select('*')
      .eq('order_status', 'completed')
      .eq('payment_status', 'paid');

    return (orders && orders.length > 0) || false;
  } catch (error) {
    console.error('Error checking one-off purchase:', error);
    return false;
  }
}

// Get user's purchase history
export async function getUserPurchases(): Promise<Purchase[]> {
  try {
    const { data, error } = await supabase
      .from('stripe_user_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return [];
  }
}