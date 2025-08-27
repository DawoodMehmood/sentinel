const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Utility: add minutes to a Date and return a new Date.
 */
function addMinutes(base, mins) {
  return new Date(base.getTime() + mins * 60 * 1000);
}

/**
 * Insert a linear sequence of apps for a given employee with 1–5 minute spacing.
 */
async function seedAppsForEmployee({ companyId, employeeId, startAt, apps, stepMinutes = 2 }) {
  const rows = [];
  for (let i = 0; i < apps.length; i++) {
    rows.push({
      companyId,
      employeeId,
      app: apps[i].toLowerCase(),
      createdAt: addMinutes(startAt, i * stepMinutes),
    });
  }
  if (rows.length) {
    await prisma.activitySpan.createMany({ data: rows, skipDuplicates: true });
  }
}

async function main() {
  console.log("🔄 Seeding…");

  // 1) Company (User)
  // If you already have a company with slug "test-co", this will reuse it
  let company = await prisma.user.findUnique({ where: { slug: "test-co" } });
  if (!company) {
    company = await prisma.user.create({
      data: {
        name: "Test Company",
        email: "seed@test.com",
        slug: "test-co",
        userLimit: 20,
        password: "12345678"
      },
    });
  }
  console.log("🏢 Company:", company.slug);

  // 2) Employees
  // Upsert Alice
  let alice = await prisma.employee.findFirst({
    where: { companyId: company.id, email: "alice@test-co.com" },
  });
  if (!alice) {
    alice = await prisma.employee.create({
      data: {
        companyId: company.id,
        name: "Alice",
        email: "alice@test-co.com",
        token: "alice-token-seed",
      },
    });
  }
  // Upsert Bob
  let bob = await prisma.employee.findFirst({
    where: { companyId: company.id, email: "bob@test-co.com" },
  });
  if (!bob) {
    bob = await prisma.employee.create({
      data: {
        companyId: company.id,
        name: "Bob",
        email: "bob@test-co.com",
        token: "bob-token-seed",
      },
    });
  }
  console.log("👤 Employees:", alice.name, "and", bob.name);

  // 3) Seed ActivitySpan across multiple days with deliberate repeats
  // We’ll plant repeating sequences so your miner finds patterns like:
  //  - chrome>excel>powerbi
  //  - slack>chrome
  //
  // Day offsets
  const today = new Date();
  const day1 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 9, 0, 0);
  const day2 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 9, 0, 0);
  const day3 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0);

  // Alice:
  // - Day 1 contains two repeats of "chrome>excel>powerbi"
  // - Day 2 repeats again; adds slack>chrome
  // - Day 3 repeats in different order
  await seedAppsForEmployee({
    companyId: company.id,
    employeeId: alice.id,
    startAt: day1,
    apps: [
      "chrome", "excel", "powerbi",
      "slack",
      "chrome", "excel", "powerbi",
      "figma", "slack"
    ],
    stepMinutes: 3,
  });

  await seedAppsForEmployee({
    companyId: company.id,
    employeeId: alice.id,
    startAt: day2,
    apps: [
      "chrome", "excel", "powerbi", // another repeat
      "slack", "chrome",            // slack>chrome
      "figma"
    ],
    stepMinutes: 4,
  });

  await seedAppsForEmployee({
    companyId: company.id,
    employeeId: alice.id,
    startAt: day3,
    apps: [
      "excel", "powerbi", "chrome", // re-appears but rotated
      "slack"
    ],
    stepMinutes: 5,
  });

  // Bob:
  // - Day 1 repeats "outlook>word>outlook"
  // - Day 2 repeats again and includes chrome>excel
  // - Day 3 has a long stretch of chrome to test collapseConsecutive
  await seedAppsForEmployee({
    companyId: company.id,
    employeeId: bob.id,
    startAt: day1,
    apps: [
      "outlook", "word", "outlook",
      "teams",
      "outlook", "word", "outlook",
    ],
    stepMinutes: 2,
  });

  await seedAppsForEmployee({
    companyId: company.id,
    employeeId: bob.id,
    startAt: day2,
    apps: [
      "chrome", "excel",
      "outlook", "word", "outlook",
    ],
    stepMinutes: 3,
  });

  await seedAppsForEmployee({
    companyId: company.id,
    employeeId: bob.id,
    startAt: day3,
    apps: [
      "chrome", "chrome", "chrome", // duplicates should collapse in miner
      "excel", "outlook"
    ],
    stepMinutes: 2,
  });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
