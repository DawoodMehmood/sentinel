// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // Only guard dashboard (and its nested routes)
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = new URL('/signin', origin);
      // Preserve intended destination
      url.searchParams.set('callbackUrl', pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
    // You can add tenant checks here later (e.g., has company slug, subscription ok, etc.)
  }

  return NextResponse.next();
}

// Limit to dashboard
export const config = {
  matcher: ['/dashboard/:path*'],
};
