// FILE: app/lib/supabase/server.ts

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 1. Thêm từ khóa 'async' vào hàm này
export const createSupabaseServerClient = async () => {
  // 2. Thêm 'await' để lấy cookieStore thật (không phải Promise)
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Lỗi này xảy ra nếu gọi từ Server Component (nơi không thể set cookie)
            // Có thể bỏ qua
          }
        },
      },
    }
  );
};