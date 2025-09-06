// stripe/pricingData.ts
import type { Price } from '@/types/price';

export const pricingData = [
  { planId: 'basic',    unit_amount: 2000, nickname: 'Basic',    offers: ['3 users'] },
  { planId: 'pro',      unit_amount: 3000, nickname: 'Pro',      offers: ['5 users'] },
  { planId: 'business', unit_amount: 5000, nickname: 'Business', offers: ['10 users'] },
] as const satisfies ReadonlyArray<Price>;


// export const pricingData: Price[] = [
//   {
//     id: "price_1NQk5TLtGdPVhGLecVfQ7mn0",
//     unit_amount: 100 * 100,
//     nickname: "Basic",
//     offers: [
//       "1 User",
//       "All UI components",
//       "Lifetime access",
//       "Free updates",
//       "Use on 1 (one) project",
//       "3 Months support",
//     ],
//   },
//   {
//     id: "price_1NQk55LtGdPVhGLefU8AHqHr",
//     unit_amount: 200 * 100,
//     nickname: "Premium",
//     offers: [
//       "5 Users",
//       "All UI components",
//       "Lifetime access",
//       "Free updates",
//       "Use on 1 (one) project",
//       "3 Months support",
//     ],
//   },
//   {
//     id: "price_1NQk4eLtGdPVhGLeZsZDsCNz",
//     unit_amount: 300 * 100,
//     nickname: "Business",
//     offers: [
//       "10 Users",
//       "All UI components",
//       "Lifetime access",
//       "Free updates",
//       "Use on 1 (one) project",
//       "3 Months support",
//     ],
//   },
// ];
