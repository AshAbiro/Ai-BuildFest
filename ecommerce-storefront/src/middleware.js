import { NextResponse } from 'next/server';

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};

export default function middleware(req) {
    const url = req.nextUrl;
    const hostname = req.headers.get('host') || '';

    // Extract subdomain for both local (any port) and production environments
    let subdomain = hostname
        .replace(/\.scaleup\.codes(:\d+)?$/, '')   // Remove production domain
        .replace(/^scaleup\.codes(:\d+)?$/, '')     // Failsafe for root production
        .replace(/\.localhost(:\d+)?$/, '')          // Remove any local subdomain suffix
        .replace(/^localhost(:\d+)?$/, '');          // Failsafe for bare localhost

    // Bypass for main platform root / known non-tenant hostnames
    if (!subdomain || subdomain === 'www' || subdomain === 'shop' || subdomain === 'admin') {
        return NextResponse.next();
    }

    // Rewrite: nike.localhost:3000/cart → /nike/cart internally
    return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url));
}
