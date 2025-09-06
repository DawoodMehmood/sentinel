// types/price.ts
import type { PlanId } from '@/lib/plans';

export type Price = {
  planId: PlanId;          // <- literal union, not string
  unit_amount: number;     // cents
  nickname: string;
  offers: string[];
};
