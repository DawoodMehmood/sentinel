import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {prisma} from '@/utils/prismaDB';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  companySlug: z.string().trim().min(1),   // now REQUIRED
  deviceId: z.string().trim().min(3),
  platform: z.string().trim().min(2),
  hostname: z.string().trim().min(1).optional(),
});

function bearer(req: NextRequest) {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

export async function POST(req: NextRequest) {
  try {
    const token = bearer(req);
    if (!token) {
      return NextResponse.json({ message: 'Missing bearer token' }, { status: 401 });
    }

    const body = Body.parse(await req.json());

    // Look up employee by token INCLUDING company to verify slug
    const employee = await prisma.employee.findUnique({
      where: { token },
      include: { company: true },
    });

    if (!employee || !employee.tokenActive) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Require slug to match the employee's company
    if (!employee.company.slug || employee.company.slug !== body.companySlug) {
      return NextResponse.json({ message: 'Company mismatch' }, { status: 403 });
    }

    // Subscription check
    if (employee.company.subscriptionEnd && employee.company.subscriptionEnd < new Date()) {
      return NextResponse.json({ message: 'Subscription expired' }, { status: 402 });
    }

    // Enforce one-device binding
    if (!employee.boundDeviceId) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { boundDeviceId: body.deviceId, lastUsed: new Date() },
      });
    } else if (employee.boundDeviceId !== body.deviceId) {
      return NextResponse.json({ message: 'Token already bound to another device' }, { status: 403 });
    } else {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { lastUsed: new Date() },
      });
    }

    return NextResponse.json({
      ok: true,
      deviceId: body.deviceId,
      company: employee.company.slug,
    });
  } catch (e: any) {
    if (e?.issues) {
      return NextResponse.json({ message: e.issues.map((i: any) => i.message) }, { status: 400 });
    }
    return NextResponse.json({ message: e?.message || 'Server error' }, { status: 500 });
  }
}
