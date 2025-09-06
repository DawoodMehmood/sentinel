'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { cn } from '@/lib/utils';

type Props = {
  planId: string;                 // 'basic' | 'pro' | 'business'
  children: React.ReactNode;
  className?: string;
};

export default function CheckoutButton({ planId, children, className }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (!planId) return;
    setLoading(true);
    try {

      const { data } = await axios.post(
        '/api/payment',
        { planId, origin: 'dashboard' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      alert('Could not start checkout. Please try again.');
    } catch (e) {
      console.error(e);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'rounded-md px-3 py-2',
        className
      )}
    >
      {loading ? 'Redirecting…' : children}
    </button>
  );
}
