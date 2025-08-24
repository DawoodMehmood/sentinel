import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {prisma} from '@/utils/prismaDB';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Span = z.object({
  type: z.literal('ACTIVE_SPAN'),
  app: z.string().min(1),
  title: z.string().default(''),
  titleNorm: z.string().default(''),
  startTs: z.number().int(),          // epoch ms
  endTs: z.number().int(),
  durationMs: z.number().int().nonnegative(),
  inferredEnd: z.boolean().optional(),
});

const Body = z.object({
  companySlug: z.string().trim().min(1),   // now REQUIRED
  deviceId: z.string().min(3),
  events: z.array(Span).min(1).max(200),
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

    // Enforce binding + subscription
    if (!employee.boundDeviceId) {
      return NextResponse.json({ message: 'Token not registered to any device' }, { status: 403 });
    }
    if (employee.boundDeviceId !== body.deviceId) {
      return NextResponse.json({ message: 'Token bound to another device' }, { status: 403 });
    }
    if (employee.company.subscriptionEnd && employee.company.subscriptionEnd < new Date()) {
      return NextResponse.json({ message: 'Subscription expired' }, { status: 402 });
    }

    const rows = body.events.map(e => ({
      companyId: employee.companyId,
      employeeId: employee.id,
      startTs: new Date(e.startTs),
      endTs: new Date(e.endTs),
      durationMs: e.durationMs,
      app: e.app.toLowerCase(),
      titleNorm: e.titleNorm || '',
      rawTitle: e.title || null,
      inferredEnd: !!e.inferredEnd,
    }));

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
