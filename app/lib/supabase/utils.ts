// // lib/supabase/utils.ts
// import { createBrowserClient, createServerClient } from '@supabase/ssr';
// import { cookies } from 'next/headers';
// import { NextRequest, NextResponse } from 'next/server';

// export const createClient = () =>
//   createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   );

// // Server Client (cho Server Components/Actions) - Remove try/catch to allow cookie mutations in actions
// export async function createServerSupabaseClient() {
//   const cookieStore = await cookies();

//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return cookieStore.getAll();
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) =>
//             cookieStore.set(name, value, options)
//           );
//         },
//       },
//     }
//   );
// }

// // Middleware Client (keep as-is, no changes needed)
// export function createMiddlewareSupabaseClient(req: NextRequest) {
//   let response = NextResponse.next({
//     request: {
//       headers: req.headers,
//     },
//   });

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return req.cookies.getAll();
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) => {
//             req.cookies.set({ name, value, ...options });
//             response.cookies.set({ name, value, ...options });
//           });
//         },
//       },
//     }
//   );

//   return { supabase, response };
// }