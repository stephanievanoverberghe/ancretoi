import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sessionCookieName } from '@/lib/session';

export function middleware(req: NextRequest) {
    const p = req.nextUrl.pathname;
    const protectedPath = p.startsWith('/app') || p.startsWith('/admin');
    if (protectedPath) {
        const has = req.cookies.get(sessionCookieName)?.value;
        if (!has) {
            const url = new URL('/login', req.url);
            url.searchParams.set('next', p);
            return NextResponse.redirect(url);
        }
    }
    return NextResponse.next();
}
export const config = { matcher: ['/app/:path*', '/admin/:path*'] };
