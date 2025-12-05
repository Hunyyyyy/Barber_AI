// middleware.ts
import { createMiddlewareSupabaseClient } from '@/lib/supabase/utils';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_API_PATHS = [
  // '/api/auth/register',
  // '/api/gemini/analyze',
  '/api/sepay/webhook',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Check API Key nội bộ (như cũ)
  if (PROTECTED_API_PATHS.some(p => pathname.startsWith(p))) {
    const authHeader = req.headers.get('authorization');
    const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
    if (!authHeader || authHeader !== `Bearer ${INTERNAL_API_SECRET}`) {
      return new NextResponse('Unauthorized – API nội bộ', { status: 401 });
    }
    return NextResponse.next();
  }

  // 2. Khởi tạo Supabase & lấy User
  const { supabase, response } = createMiddlewareSupabaseClient(req);
  const { data: { user } } = await supabase.auth.getUser();

  // === LOGIC MỚI BẮT ĐẦU TỪ ĐÂY ===
  
  // Lấy Role từ metadata (Nếu chưa có thì mặc định là USER)
  // Lưu ý: Cần đảm bảo lúc đăng ký/update role bạn đã sync vào metadata
  const userRole = user?.user_metadata?.role || 'USER';

  const protectedPaths = ['/queue', '/admin', '/try-hair', '/home'];
  const authPaths = ['/login', '/register'];
  const adminPaths = ['/admin']; // Trang chỉ dành cho Admin

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));
  const isAdminPage = adminPaths.some((path) => pathname.startsWith(path));

  // CASE A: Chưa đăng nhập mà vào trang bảo vệ -> Đá về Login
  if (isProtected && !user) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // CASE B: Đã đăng nhập mà cố vào Login/Register -> Chuyển hướng theo Role
  if (isAuthPage && user) {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.redirect(new URL('/queue', req.url));
  }

  // CASE C: User thường cố vào trang Admin -> Đá về Queue
  if (isAdminPage && user && userRole !== 'ADMIN') {
    // Redirect về trang queue hoặc trang thông báo lỗi 403
    return NextResponse.redirect(new URL('/queue', req.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};