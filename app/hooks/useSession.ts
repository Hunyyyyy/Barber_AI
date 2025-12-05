// hooks/useSession.ts
'use client';

// SỬA: Import đúng tên hàm và đường dẫn (giả sử bạn đã config alias @)
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js'; // Import type User
import { useEffect, useState } from 'react';

export function useSession() {
  const [user, setUser] = useState<User | null>(null); // SỬA: Dùng type User thay vì any
  const [loading, setLoading] = useState(true);
  
  // SỬA: Gọi đúng tên hàm createClient
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        // 1. Kiểm tra nhanh trong LocalStorage
        const isProbablyLoggedIn = typeof window !== 'undefined' && 
          Object.keys(window.localStorage).some(key => 
            key.startsWith('sb-') && key.endsWith('-auth-token')
          );

        // 2. Lấy session thực tế
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          if (session) {
            // Trường hợp 1: Có session -> Set User, tắt Loading
            setUser(session.user);
            setLoading(false);
          } else if (isProbablyLoggedIn) {
             // Trường hợp 2: Có token rác nhưng chưa có session (đang refresh) -> Giữ loading
             setUser(null);
          } else {
            // Trường hợp 3: Guest -> Tắt loading
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

    // 3. Lắng nghe thay đổi trạng thái
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]); // Thêm supabase vào dependency array (best practice)

  return { user, loading };
}