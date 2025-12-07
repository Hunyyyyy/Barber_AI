// middleware.ts
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware'; // <--- SỬA ĐƯỜNG DẪN IMPORT
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse, type NextRequest } from 'next/server';

// const PROTECTED_API_PATHS = [
//  // '/api/sepay/webhook',
// ];

// Khởi tạo Ratelimit (Giữ nguyên)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";

  // === A. RATE LIMITING ===
  if (pathname.startsWith('/api') || pathname.startsWith('/login') || pathname.startsWith('/queue')) {
    try {
        const { success, limit, reset, remaining } = await ratelimit.limit(ip);
        if (!success) {
          return new NextResponse("Too Many Requests (Bạn thao tác quá nhanh, vui lòng thử lại sau)", {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          });
        }
    } catch (e) {
        console.error("Rate limit error:", e);
        // Nếu Redis lỗi, vẫn cho qua để không chặn người dùng thật
    }
  }

  // === B. LOGIC AUTH ===

  // 1. Check API Key nội bộ
  // if (PROTECTED_API_PATHS.some(p => pathname.startsWith(p))) {
  //   const authHeader = req.headers.get('authorization');
  //   const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
  //   if (!authHeader || authHeader !== `Bearer ${INTERNAL_API_SECRET}`) {
  //     return new NextResponse('Unauthorized – API nội bộ', { status: 401 });
  //   }
  //   return NextResponse.next();
  // }

  // 2. Khởi tạo Supabase (Sử dụng hàm từ file mới)
  const { supabase, response } = createMiddlewareSupabaseClient(req);
  
  // Quan trọng: getUser sẽ làm mới session nếu cần
  const { data: { user } } = await supabase.auth.getUser();

  const userRole = user?.user_metadata?.role || 'USER';

  const protectedPaths = ['/queue', '/admin', '/try-hair', '/home'];
  const authPaths = ['/login', '/register'];
  const adminPaths = ['/admin'];

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));
  const isAdminPage = adminPaths.some((path) => pathname.startsWith(path));
  const isRootPage = pathname === '/';
  // Logic Redirect
  if (isProtected && !user) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPage && user) {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.redirect(new URL('/home', req.url));
  }

  if (isRootPage && user) {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.redirect(new URL('/home', req.url));
  }

  if (isAdminPage && user && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};