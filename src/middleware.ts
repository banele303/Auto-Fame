import { NextRequest, NextResponse } from 'next/server';

// Middleware to protect admin routes
export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Processing request for path: ${pathname}`);

  // EXIT EARLY IF API ROUTE (Should be handled by matcher, but failsafe)
  if (pathname.startsWith('/api')) {
      console.log(`[Middleware] Bypassing auth for API route: ${pathname}`);
      return NextResponse.next();
  }

  // Only apply middleware to admin routes (except admin-login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    console.log(`[Middleware] Checking auth for admin route: ${pathname}`);
    // Check for the admin auth token cookie
    const adminAuthToken = request.cookies.get('admin_auth_token');
    
    // If no admin auth token, redirect to admin login
    if (!adminAuthToken) {
      console.log(`[Middleware] No admin token found, redirecting to /admin-login from ${pathname}`);
      // Save the requested URL to redirect back after login
      const url = new URL('/admin-login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
    console.log(`[Middleware] Admin token found, allowing access to ${pathname}`);
  }
  
  // Continue with the request for non-admin routes or authenticated admin routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
