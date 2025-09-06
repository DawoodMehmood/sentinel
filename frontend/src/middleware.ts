// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /dashboard/*
  if (!pathname.startsWith('/dashboard')) return NextResponse.next();

  // --- 0) Always allow Stripe success page to pass ---
  // Do this BEFORE any auth/subscription checks so Stripe redirect never loops.
  if (pathname.startsWith('/dashboard/billing/confirm')) {
    return NextResponse.next();
  }

  // --- 1) Auth guard for the rest of dashboard ---
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('callbackUrl', pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // --- 2) Allow the whole billing area so users can renew/upgrade ---
  const isBillingArea = pathname.startsWith('/dashboard/billing');
  if (isBillingArea) {
    return NextResponse.next();
  }

  // --- 3) For all other dashboard routes, enforce subscription status ---
  try {
    const statusRes = await fetch(new URL('/api/billing/status', req.url), {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });

    if (statusRes.ok) {
      const { status } = (await statusRes.json()) as {
        status: 'none' | 'active' | 'expired';
      };

      if (status === 'none') {
        const url = req.nextUrl.clone();
        url.pathname = '/pricing';
        url.search = '';
        return NextResponse.redirect(url);
      }

      if (status === 'expired') {
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard/billing';
        url.search = '';
        return NextResponse.redirect(url);
      }
    }
    // If the status call fails, fall through and allow.
  } catch {
    // Safe default: allow
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
