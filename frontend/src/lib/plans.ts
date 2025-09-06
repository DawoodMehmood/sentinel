// lib/plans.ts
export type PlanId = 'basic' | 'pro' | 'business';

export const PLANS = {
  basic:    { id: 'basic',    label: 'Basic',    seats: 3,  amountCents: 2000 },
  pro:      { id: 'pro',      label: 'Pro',      seats: 5,  amountCents: 3000 },
  business: { id: 'business', label: 'Business', seats: 10, amountCents: 5000 },
} as const;


export function ensurePlan(id: string): (typeof PLANS)[PlanId] | null {
  return (PLANS as any)[id] ?? null;
}
