// app/api/payment/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import { stripe } from '@/lib/stripe';
import { ensurePlan } from '@/lib/plans';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = session.user.id;

  const { planId, origin } = await req.json().catch(() => ({}));
  const plan = ensurePlan(planId);
  if (!plan) return NextResponse.json({ error: 'Invalid planId' }, { status: 400 });

  // Ensure we have the company to get email (optional)
  const company = await prisma.user.findUnique({ where: { id: companyId }, select: { email: true, name: true }});
  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/confirm?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl  = origin === 'dashboard' ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing` : `${process.env.NEXT_PUBLIC_APP_URL}/pricing`;

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',             // 🔴 one-time payment
    customer_email: company?.email || undefined, // or create customers if you want
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: plan.amountCents,
          product_data: {
            name: `${plan.label} plan (${plan.seats} users) — 30 days`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      app_company_id: companyId,
      plan_id: plan.id,
      seats: String(plan.seats),
      amount_cents: String(plan.amountCents),
    },
  });

  return NextResponse.json({ url: checkout.url }, { status: 200 });
}
