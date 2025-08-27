import { prisma } from '@/utils/prismaDB';
import { authOptions } from '@/utils/auth';
import { getServerSession } from 'next-auth';
import { searchParamsCache } from '@/lib/searchparams';
import { PatternTable } from './pattern-table';
import { columns } from './pattern-table/columns';

const SORT_FIELDS = ['n', 'support', 'employees', 'lastSeen'] as const;
type SortField = (typeof SORT_FIELDS)[number];

function safeDecode(s: string) { try { return decodeURIComponent(s); } catch { return s; } }
function safeJson<T = unknown>(s: string): T | null { try { return JSON.parse(s) as T; } catch { return null; } }

function resolveSort(): { sortBy: SortField; sortDir: 'asc' | 'desc' } {
  const raw = searchParamsCache.get('sort'); // may be url-encoded stringified JSON
  if (raw) {
    const candidates = [String(raw), safeDecode(String(raw))];
    for (const cand of candidates) {
      const arr = safeJson<Array<{ id: string; desc?: boolean }>>(cand);
      const first = Array.isArray(arr) ? arr[0] : null;
      if (first && (SORT_FIELDS as readonly string[]).includes(first.id)) {
        return { sortBy: first.id as SortField, sortDir: first.desc ? 'desc' : 'asc' };
      }
    }
  }
  // default
  return { sortBy: 'lastSeen', sortDir: 'desc' };
}

export default async function PatternsListingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const page = Number(searchParamsCache.get('page') ?? 1);
  const perPage = Number(searchParamsCache.get('perPage') ?? 10);

  const { sortBy, sortDir } = resolveSort();
  const seqKeySearch = (searchParamsCache.get('seqKey') ?? '').toString().trim();

  const where = {
    companyId: session.user.id,
    support: { gt: 1 },
    ...(seqKeySearch && { seqKey: { contains: seqKeySearch, mode: 'insensitive' as const } }),
  };

  const [items, total] = await Promise.all([
    prisma.seqPatternCompany.findMany({
      where,
      orderBy: { [sortBy]: sortDir }, // 👈 now driven by ?sort=[...]
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        seqKey: true,
        n: true,
        support: true,
        employees: true,
        lastSeen: true,
      },
    }),
    prisma.seqPatternCompany.count({ where }),
  ]);

  const rows = items.map(i => ({
    id: i.id,
    seqKey: i.seqKey,
    n: i.n,
    support: i.support,
    employees: i.employees,
    lastSeen: i.lastSeen.toISOString(),
  }));

  return <PatternTable data={rows} totalItems={total} columns={columns} />;
}
