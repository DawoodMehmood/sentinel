import { prisma } from '@/utils/prismaDB';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import BillingSection from './billing-section';

export default async function BillingListing() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    const company = session.user;
    const companyId = company.id;

    const [user, employeesCount, history] = await Promise.all([
        prisma.user.findUnique({
            where: { id: companyId },
            select: { userLimit: true, subscriptionEnd: true },
        }),
        prisma.employee.count({ where: { companyId } }),
        prisma.billingRecord.findMany({
            where: { companyId },
            orderBy: { paidAt: 'desc' },
            select: { id: true, planId: true, seats: true, amountCents: true, paidAt: true },
        }),
    ]);

    const data = {
        userLimit: user?.userLimit ?? 0,
        subscriptionEnd: user?.subscriptionEnd
            ? user.subscriptionEnd.toISOString()  // 👈 pass ISO string only
            : null,
        employeesCount,
        history: history.map(h => ({
            ...h,
            paidAt: h.paidAt.toISOString(),      // 👈 pass ISO only
        })),
    };

    return <BillingSection data={data} company={company} />;
}
