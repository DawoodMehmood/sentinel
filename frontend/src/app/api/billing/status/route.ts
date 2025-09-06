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

  const [user, historyCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: companyId },
      select: { userLimit: true, subscriptionEnd: true },
    }),
    prisma.billingRecord.count({ where: { companyId } }),
  ]);

  const now = new Date();
  const userLimit = user?.userLimit ?? 0;
  const end = user?.subscriptionEnd ?? null;

  let status: 'none' | 'active' | 'expired' = 'none';
  if (userLimit > 0 && end && end > now) status = 'active';
  else if (historyCount > 0 && (!end || end <= now)) status = 'expired';
  else status = 'none';
  
  console.log('Billing status:', { status, userLimit, end, now, historyCount });

  return NextResponse.json({
    status,
    userLimit,
    subscriptionEnd: end?.toISOString() ?? null,
    consumed: await prisma.employee.count({ where: { companyId } }),
  });
}
