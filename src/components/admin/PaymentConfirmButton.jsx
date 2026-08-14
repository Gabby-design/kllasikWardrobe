'use client';

import { useState } from 'react';
import { confirmPayment } from '../../../app/actions/adminOrders';
import toast from 'react-hot-toast';

export function PaymentConfirmButton({ orderId }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!window.confirm('Are you sure you want to mark this payment as confirmed? An email receipt will be sent to the customer.')) {
      return;
    }

    setLoading(true);
    try {
      await confirmPayment(orderId);
      toast.success('Payment confirmed successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConfirm}
      disabled={loading}
      className="bg-[#1a1a1a] text-white px-3 py-1 text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 mt-2"
    >
      {loading ? 'Confirming...' : 'Confirm'}
    </button>
  );
}
