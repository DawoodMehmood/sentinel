import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const companyId = session.user.id;

  const [user, employeesCount, history] = await Promise.all([
    prisma.user.findUnique({
      where: { id: companyId },
      select: { userLimit: true, subscriptionEnd: true },
    }),
    prisma.employee.count({ where: { companyId } }),
    prisma.billingRecord.findMany({
      where: { companyId },
      orderBy: { paidAt: 'desc' },
      take: 50,
      select: { id: true, planId: true, seats: true, amountCents: true, paidAt: true },
    }),
  ]);

  return NextResponse.json({
    userLimit: user?.userLimit ?? 0,
    subscriptionEnd: user?.subscriptionEnd?.toISOString() ?? null,
    employeesCount,
    history: history.map(h => ({
      ...h,
      paidAt: h.paidAt.toISOString(),
    })),
  });
}
