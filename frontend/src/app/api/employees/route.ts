import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/utils/prismaDB';
import { authOptions } from '@/utils/auth';
import { z } from 'zod';
import crypto from 'crypto';

// ---------- utils ----------
function genToken() {
  // short, URL-safe-ish token; adjust length as needed
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

// ---------- GET: list employees ----------
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const companyId = session.user.id;

  const items = await prisma.employee.findMany({
    where: { companyId },
    orderBy: [{ lastUsed: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      token: true,           // 👈 include token for the table
      tokenActive: true,
      boundDeviceId: true,
      lastUsed: true,
    },
  });

  const total = await prisma.employee.count({ where: { companyId } });

  return NextResponse.json({ total, items });
}

// ---------- POST: create employee ----------
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const companyId = session.user.id;

  // Enforce company userLimit
  const company = await prisma.user.findUnique({
    where: { id: companyId },
    select: { userLimit: true },
  });
  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  const count = await prisma.employee.count({ where: { companyId } });
  if (count >= (company.userLimit ?? 0)) {
    return NextResponse.json(
      { error: `User limit reached (${company.userLimit}).` },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parse = CreateEmployeeSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parse.error.flatten() },
      { status: 400 }
    );
    }

  const { name, email } = parse.data;
  const token = genToken();

  try {
    const created = await prisma.employee.create({
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
        token: true,          // 👈 return token so we can show it immediately if needed
        tokenActive: true,
        boundDeviceId: true,
        lastUsed: true,
      },
    });

    return NextResponse.json({ success: true, employee: created }, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate email already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
