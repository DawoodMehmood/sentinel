import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/utils/prismaDB';
import { authOptions } from '@/utils/auth';
import { z } from 'zod';

// accepted sort fields -> prisma keys
const SORT_FIELDS = ['n', 'support', 'employees', 'lastSeen'] as const;

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(SORT_FIELDS).default('lastSeen'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const parse = QuerySchema.safeParse({
    page: url.searchParams.get('page'),
    perPage: url.searchParams.get('perPage'),
    sortBy: url.searchParams.get('sortBy'),
    sortDir: url.searchParams.get('sortDir'),
  });

  if (!parse.success) {
    return NextResponse.json(
      { error: 'Invalid query', issues: parse.error.flatten() },
      { status: 400 }
    );
  }

  const { page, perPage, sortBy, sortDir } = parse.data;
  const companyId = session.user.id;

  // 🔎 only show patterns with support > 1
  const baseWhere = { companyId, support: { gt: 1 } };

  const [items, total] = await Promise.all([
    prisma.seqPatternCompany.findMany({
      where: baseWhere,
      orderBy: { [sortBy]: sortDir },
      take: perPage,
      skip: (page - 1) * perPage,
      select: {
        id: true,
        seqKey: true,
        n: true,
        support: true,
        employees: true,
        lastSeen: true,
      },
    }),
    prisma.seqPatternCompany.count({ where: baseWhere }),
  ]);

  return NextResponse.json({ total, items });
}
