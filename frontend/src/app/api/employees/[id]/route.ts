import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/utils/auth";
import { prisma } from '@/utils/prismaDB';
import crypto from 'crypto';

function genToken() {
  return crypto.randomBytes(24).toString('base64url');
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const companyId = session.user.id;
  const { action } = await req.json().catch(() => ({} as { action?: 'toggle' | 'regenerate' }));

  const employee = await prisma.employee.findFirst({
    where: { id: params.id, companyId },
    select: { id: true, tokenActive: true },
  });
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'toggle') {
    const updated = await prisma.employee.update({
      where: { id: employee.id },
      data: { tokenActive: !employee.tokenActive },
    });
    return NextResponse.json({ success: true, employee: updated });
  }

  if (action === 'regenerate') {
    const updated = await prisma.employee.update({
      where: { id: employee.id },
      data: { token: genToken(), boundDeviceId: null },
    });
    return NextResponse.json({ success: true, employee: updated });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const companyId = session.user.id;

  // Ensure employee belongs to company
  const employee = await prisma.employee.findFirst({
    where: { id: params.id, companyId },
    select: { id: true },
  });
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.employee.delete({ where: { id: employee.id } });
  return NextResponse.json({ success: true });
}
