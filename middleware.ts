import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sessionCookieName } from '@/lib/session';

export function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    if (path.startsWith('/app')) {
        const has = req.cookies.get(sessionCookieName)?.value;
        if (!has) {
            const url = new URL('/login', req.url);
            url.searchParams.set('next', path);
            return NextResponse.redirect(url);
        }
    }
    return NextResponse.next();
}
export const config = { matcher: ['/app/:path*'] };
