// app/api/agent/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/utils/prismaDB';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Incoming events
const AppFocus = z.object({
  type: z.literal('APP_FOCUS'),
  app: z.string().min(1),
  title: z.string().default(''),     // accepted but ignored in DB
  titleNorm: z.string().default(''), // accepted but ignored in DB
  ts: z.number().int(),              // epoch ms
});

const SystemOff = z.object({
  type: z.literal('SYSTEM_OFF'),
  reason: z.string().default('stop'),
  ts: z.number().int(),              // epoch ms
});

const Body = z.object({
  companySlug: z.string().trim().min(1),
  deviceId: z.string().min(3),
  events: z.array(z.union([AppFocus, SystemOff])).min(1).max(200),
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

    const employee = await prisma.employee.findUnique({
      where: { token },
      include: { company: true },
    });

    if (!employee || !employee.tokenActive) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Require slug to match
    if (!employee.company.slug || employee.company.slug !== body.companySlug) {
      return NextResponse.json({ message: 'Company mismatch' }, { status: 403 });
    }

    // Enforce device binding + subscription
    if (!employee.boundDeviceId) {
      return NextResponse.json({ message: 'Token not registered to any device' }, { status: 403 });
    }
    if (employee.boundDeviceId !== body.deviceId) {
      return NextResponse.json({ message: 'Token bound to another device' }, { status: 403 });
    }
    if (employee.company.subscriptionEnd && employee.company.subscriptionEnd < new Date()) {
      return NextResponse.json({ message: 'Subscription expired' }, { status: 402 });
    }

    // Map to your slim ActivitySpan: (companyId, employeeId, app, createdAt)
    const rows = body.events.map((e) => {
      const when = new Date(e.ts);
      if (e.type === 'APP_FOCUS') {
        return {
          companyId: employee.companyId,
          employeeId: employee.id,
          app: e.app.toLowerCase(), // app-level only
          createdAt: when,          // preserve real event time
        };
      } else {
        // SYSTEM_OFF marker encoded as an app value
        return {
          companyId: employee.companyId,
          employeeId: employee.id,
          app: 'system_off',
          createdAt: when,
        };
      }
    });

    if (rows.length) {
      await prisma.activitySpan.createMany({ data: rows });
      await prisma.employee.update({
        where: { id: employee.id },
        data: { lastUsed: new Date() },
      });
    }

    return NextResponse.json({ ok: true, accepted: rows.length });
  } catch (e: any) {
    if (e?.issues) {
      return NextResponse.json({ message: e.issues.map((i: any) => i.message) }, { status: 400 });
    }
    return NextResponse.json({ message: e?.message || 'Server error' }, { status: 500 });
  }
}
