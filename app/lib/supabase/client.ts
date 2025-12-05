// lib/supabase/client.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Client-side Supabase client
 * Dùng trong các component có 'use client' (hooks, realtime, v.v.)
 */
// Đổi tên export để khớp với cách dùng trong các hook (createClient)
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Tiện lợi: export luôn một instance để dùng khắp nơi
// Đổi tên thành supabaseClient để tiện phân biệt
export const supabaseClient = createClient();