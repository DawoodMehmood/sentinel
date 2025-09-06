// app/api/register/route.ts
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { prisma } from '@/utils/prismaDB'; // adjust if your prisma client lives elsewhere

// --- helpers ---
function slugifyBase(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')   // spaces & symbols -> "-"
    .replace(/^-+|-+$/g, '');      // trim leading/trailing "-"
}

function randomSuffix(len = 5) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Generate a unique slug. Try the base first, then base-xyz, base-xyz2, ...
 * Retries a handful of times to avoid rare collisions/races.
 */
async function generateUniqueSlug(name: string, maxTries = 6): Promise<string> {
  const base = slugifyBase(name) || 'company';
  let attempt = 0;

  while (attempt < maxTries) {
    const candidate = attempt === 0 ? base : `${base}-${randomSuffix()}`;
    const existing = await prisma.user.findFirst({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    attempt++;
  }
  // As a last resort, stick a timestamp-ish suffix
  return `${base}-${Date.now().toString(36)}`;
}

// --- route ---
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = (body?.name ?? '').trim();
    const email = (body?.email ?? '').toLowerCase().trim();
    const password = body?.password ?? '';

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    // Basic email/password sanity (tweak as you like)
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return NextResponse.json({ message: 'Invalid email' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check duplicate email first (unique in schema)
    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique company slug
    const slug = await generateUniqueSlug(name);

    // Create the company user. Other company fields use schema defaults:
    // timezone (default "UTC"), officeEndHour (18), userLimit (3), subscriptionEnd (null)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        slug,
        // You can also set timezone from client if you collect it at signup:
        // timezone: body.timezone ?? 'UTC',
      },
      select: {
        id: true,
        name: true,
        email: true,
        slug: true,
        userLimit: true,
      },
    });

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    );
  } catch (err: any) {
    // Handle rare unique constraint races by regenerating the slug once
    const msg = err?.message || 'Server error';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
