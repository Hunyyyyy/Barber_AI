// hooks/useSession.ts
'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useSession() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        // 1. Kiểm tra nhanh trong LocalStorage xem có dấu hiệu đã đăng nhập không
        // Key mặc định của Supabase thường bắt đầu bằng "sb-" và kết thúc bằng "-auth-token"
        // Nếu dùng custom key thì bạn thay đổi string tương ứng
        const isProbablyLoggedIn = typeof window !== 'undefined' && 
          Object.keys(window.localStorage).some(key => 
            key.startsWith('sb-') && key.endsWith('-auth-token')
          );

        // 2. Lấy session thực tế
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          if (session) {
            // Trường hợp 1: Có session xịn -> Set User, tắt Loading ngay
            setUser(session.user);
            setLoading(false);
          } else if (isProbablyLoggedIn) {
             // Trường hợp 2: Không lấy được session ngay (getSession trả về null) 
             // NHƯNG trong máy lại có Token -> Khả năng cao là đang refresh token
             // -> GIỮ LOADING = TRUE, đợi onAuthStateChange xử lý tiếp
             // (Tuy nhiên vẫn set User = null tạm thời)
             setUser(null);
             // Không set Loading(false) ở đây để tránh Flash
          } else {
            // Trường hợp 3: Không có session, không có token trong máy -> Chắc chắn là Guest
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeSession();

    // 3. Lắng nghe thay đổi trạng thái (Token refresh, Sign in, Sign out)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        // Khi có sự kiện từ Auth (bất kể là đăng nhập hay đăng xuất thành công),
        // ta mới chắc chắn 100% để tắt loading
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}