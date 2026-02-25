import { NextResponse } from 'next/server';

export function middleware(request) {
  // Basic authentication for the entire site (disabled by default)
  const basicAuth = request.headers.get('authorization');
  const url = request.nextUrl;

  // Skip auth for API routes and static files
  if (url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/_next') ||
      url.pathname.includes('.')) {
    return NextResponse.next();
  }

  // Only enforce Basic Auth if explicit credentials are provided via env
  const validUser = process.env.BASIC_AUTH_USERNAME || '';
  const validPassword = process.env.BASIC_AUTH_PASSWORD || '';
  const enabled = Boolean(validUser && validPassword);

  if (!enabled) {
    return NextResponse.next();
  }

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (user === validUser && pwd === validPassword) {
      return NextResponse.next();
    }
  }

  // Return 401 with WWW-Authenticate header
  const response = new NextResponse(null, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="GadgetShack Private Store"',
    },
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
