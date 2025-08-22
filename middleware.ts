import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const protectedPath = path.startsWith('/app') || path.startsWith('/admin');
    if (protectedPath) {
        const has = req.cookies.get('ancretoi_session')?.value;
        if (!has) {
            const url = new URL('/login', req.url);
            url.searchParams.set('next', path);
            return NextResponse.redirect(url);
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/app/:path*', '/admin/:path*'],
};
