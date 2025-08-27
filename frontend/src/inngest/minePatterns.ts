// src/inngest/minePatterns.ts
import { inngest } from "@/utils/inngest";
import { prisma } from "@/utils/prismaDB";

const nMax = 5;

function collapseConsecutive(apps: string[]): string[] {
  const out: string[] = [];
  for (const a of apps) {
    if (!out.length || out[out.length - 1] !== a) out.push(a);
  }
  return out;
}

// Take the last (nMax - 1) apps as the new tail
function takeTail(seq: string[], k: number): string[] {
  if (k <= 0) return [];
  if (seq.length <= k) return [...seq];
  return seq.slice(seq.length - k);
}

export const minePatterns = inngest.createFunction(
  { id: "mine-patterns" },
  // Cron (Mon–Sat 2am) + manual event trigger
  [{ cron: "0 2 * * 1-6" }, { event: "app/mine.patterns" }],
  async ({ logger }) => {
    logger.info("Starting pattern mining (incremental, tail-aware, system-skipped)");

    // Only companies with at least one employee
    const companies = await prisma.user.findMany({
      where: { employees: { some: {} } },
      select: {
        id: true,
        employees: { select: { id: true } },
      },
    });

    for (const { id: companyId, employees } of companies) {
      for (const { id: employeeId } of employees) {
        // 1) Load cursor (lastCreatedAt + tail), filter any legacy 'system' from tail defensively
        const cursor = await prisma.patternCursor.findUnique({
          where: { companyId_employeeId: { companyId, employeeId } },
        });

        const lastTs = cursor?.lastCreatedAt ?? null;
        const tail: string[] =
          Array.isArray(cursor?.tail) ? (cursor!.tail as string[]).filter(a => a !== "system") : [];

        // 2) Fetch only NEW, NON-SYSTEM spans
        const spans = await prisma.activitySpan.findMany({
          where: {
            companyId,
            employeeId,
            app: { not: "system" },              // ← ignore SYSTEM_OFF events
            ...(lastTs ? { createdAt: { gt: lastTs } } : {}),
          },
          orderBy: { createdAt: "asc" },
          select: { app: true, createdAt: true },
        });

        if (!spans.length) {
          // Nothing new (or only system events occurred since last run) → skip
          continue;
        }

        // 3) Build combined app sequence & collapse
        const newApps = spans.map((s) => s.app).filter(a => a !== "system"); // double-safe
        if (!newApps.length) continue;

        const combined = collapseConsecutive([...tail, ...newApps]);

        // 4) Mine subsequences; since tail length = nMax-1, no pattern lies wholly in old tail.
        const now = new Date();

        for (let n = 2; n <= nMax; n++) {
          if (combined.length < n) break;

          for (let i = 0; i <= combined.length - n; i++) {
            const seqKey = combined.slice(i, i + n).join(">");

            // Distinct employees count: increment only on *first* time this employee shows the pattern
            const existed = await prisma.seqPatternLifetime.findUnique({
              where: {
                companyId_employeeId_n_seqKey: { companyId, employeeId, n, seqKey },
              },
              select: { id: true },
            });
            const firstForEmployee = !existed;

            await prisma.$transaction([
              prisma.seqPatternLifetime.upsert({
                where: { companyId_employeeId_n_seqKey: { companyId, employeeId, n, seqKey } },
                update: { support: { increment: 1 }, lastSeen: now },
                create: { companyId, employeeId, n, seqKey, support: 1, firstSeen: now, lastSeen: now },
              }),
              prisma.seqPatternCompany.upsert({
                where: { companyId_n_seqKey: { companyId, n, seqKey } },
                update: {
                  support: { increment: 1 },
                  ...(firstForEmployee ? { employees: { increment: 1 } } : {}),
                  lastSeen: now,
                },
                create: {
                  companyId,
                  n,
                  seqKey,
                  support: 1,
                  employees: 1,
                  firstSeen: now,
                  lastSeen: now,
                },
              }),
            ]);
          }
        }

        // 5) Update cursor: lastCreatedAt & new tail (filter out any 'system' defensively)
        const newLastTs = spans[spans.length - 1]!.createdAt;
        const newTail = takeTail(combined.filter(a => a !== "system"), nMax - 1);

        await prisma.patternCursor.upsert({
          where: { companyId_employeeId: { companyId, employeeId } },
          update: { lastCreatedAt: newLastTs, tail: newTail },
          create: { companyId, employeeId, lastCreatedAt: newLastTs, tail: newTail },
        });
      }
    }

    logger.info("Pattern mining complete");
    return { ok: true };
  }
);
