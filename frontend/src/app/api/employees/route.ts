// app/api/employees/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/utils/prismaDB';
import { authOptions } from '@/utils/auth';
import { z } from 'zod';
import crypto from 'crypto';

function genToken() {
  return crypto.randomBytes(24).toString('base64url');
}

const CreateEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z
    .string()
    .email('Invalid email')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
});

// ---------- GET: list employees (also return limits) ----------
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const companyId = session.user.id;

  const [items, total, company] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId },
      orderBy: [{ lastUsed: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        token: true,
        tokenActive: true,
        boundDeviceId: true,
        lastUsed: true,
      },
    }),
    prisma.employee.count({ where: { companyId } }),
    prisma.user.findUnique({
      where: { id: companyId },
      select: { userLimit: true, subscriptionEnd: true },
    }),
  ]);

  const now = new Date();
  const userLimit = company?.userLimit ?? 0;
  const subscriptionEnd = company?.subscriptionEnd ?? null;
  const subscriptionActive = !!subscriptionEnd && subscriptionEnd > now;
  const remaining = Math.max(0, userLimit - total);

  return NextResponse.json({
    total,
    items,
    quota: {
      userLimit,
      remaining,
      subscriptionActive,
      subscriptionEnd: subscriptionEnd?.toISOString() ?? null,
    },
  });
}

// ---------- POST: create employee (seat + subscription enforced) ----------
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const companyId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const parse = CreateEmployeeSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parse.error.flatten() },
      { status: 400 }
    );
  }
  const { name, email } = parse.data;

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        const company = await tx.user.findUnique({
          where: { id: companyId },
          select: { userLimit: true, subscriptionEnd: true },
        });
        if (!company) {
          throw new Response(JSON.stringify({ error: 'Company not found' }), { status: 404 });
        }

        const now = new Date();
        const active = !!company.subscriptionEnd && company.subscriptionEnd > now;
        if (!active) {
          // 402: Payment Required – prompts client to go to billing
          throw new Response(
            JSON.stringify({ error: 'Subscription inactive. Please renew to add more employees.' }),
            { status: 402 }
          );
        }

        const limit = company.userLimit ?? 0;
        if (limit <= 0) {
          throw new Response(
            JSON.stringify({ error: 'No seats available on current plan.' }),
            { status: 403 }
          );
        }

        const count = await tx.employee.count({ where: { companyId } });
        if (count >= limit) {
          throw new Response(
            JSON.stringify({ error: `User limit reached (${limit}).` }),
            { status: 403 }
          );
        }

        const token = genToken();
        const employee = await tx.employee.create({
          data: {
            companyId,
            name,
            email,
            token,
            tokenActive: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            token: true,
            tokenActive: true,
            boundDeviceId: true,
            lastUsed: true,
          },
        });

        return employee;
      },
      {
        // Helps avoid race conditions when two creates happen at once
        isolationLevel: 'Serializable',
      }
    );

    return NextResponse.json({ success: true, employee: created }, { status: 201 });
  } catch (err: any) {
    if (err instanceof Response) {
      return err; // rethrow our structured errors
    }
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate email already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
