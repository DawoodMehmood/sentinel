import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/utils/prismaDB';
import { ensurePlan } from '@/lib/plans';
import { addDays } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id) return redirect('/pricing'); // no session — send to pricing (or billing)

  const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['payment_intent'] });

  // Basic guards
  if (!session?.metadata) return redirect('/pricing');

  const planId = session.metadata.plan_id!;
  const seats = Number(session.metadata.seats || 0);
  const amountCents = Number(session.metadata.amount_cents || 0);
  const companyId = session.metadata.app_company_id!;

  const plan = ensurePlan(planId);
  if (!plan || !companyId) return redirect('/pricing');

  // Auth guard: must be the same company
  const auth = await getServerSession(authOptions);
  if (!auth?.user?.id || auth.user.id !== companyId) {
    return redirect('/signin');
  }

  // Only finalize when paid
  if (session.payment_status !== 'paid') {
    return redirect('/pricing');
  }

  // Idempotency: if already recorded, just go to overview
  const existing = await prisma.billingRecord.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (!existing) {
    // Extend by 30 days from max(now, current end)
    const company = await prisma.user.findUnique({
      where: { id: companyId },
      select: { subscriptionEnd: true },
    });
    const base = company?.subscriptionEnd && company.subscriptionEnd > new Date()
      ? company.subscriptionEnd
      : new Date();
    const newEnd = addDays(base, 30);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: companyId },
        data: {
          subscriptionEnd: newEnd,
          userLimit: seats,
        },
      }),
      prisma.billingRecord.create({
        data: {
          companyId,
          stripeSessionId: session.id,
          planId: plan.id,
          seats,
          amountCents,
          paidAt: new Date(),
        },
      }),
    ]);
  }

  // All good → land on overview
  return redirect('/dashboard/overview');
}
