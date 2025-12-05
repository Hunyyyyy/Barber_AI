// // app/api/auth/register/route.ts
// import { prisma } from '@/lib/supabase/prisma/db';
// import { NextResponse } from 'next/server';

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const { userId, email, name, phone } = body;

//     // Validate dữ liệu đầu vào
//     if (!userId || !email) {
//       return NextResponse.json(
//         { error: 'Thiếu userId hoặc email' },
//         { status: 400 }
//       );
//     }

//     // Tạo hoặc cập nhật user trong bảng User của Prisma
//     // Dùng upsert để tránh lỗi trùng id khi user đăng ký lại (hiếm nhưng có thể)
//     const user = await prisma.user.upsert({
//       where: { id: userId },
//       update: {
//         email,
//         name: name || null,
//         phone: phone || null,
//         // Nếu bạn muốn tự động active luôn
//         isActive: true,
//       },
//       create: {
//         id: userId,                    // id từ Supabase Auth
//         email,
//         name: name || 'Khách mới',
//         phone: phone || null,
//         role: 'USER' as const,
//         isActive: true,
//         // passwordHash để null vì dùng Supabase Auth
//       },
//     });

//     console.log('Tạo profile thành công cho user:', user.id, user.email);

//     return NextResponse.json({ success: true, user });
//   } catch (error: any) {
//     console.error('Lỗi khi tạo profile user (Prisma):', error);

//     // QUAN TRỌNG: Dù có lỗi Prisma thì vẫn trả 200
//     // Vì tài khoản Supabase đã tạo thành công rồi, không nên làm hỏng flow đăng ký
//     return new NextResponse(
//       JSON.stringify({
//         error: 'Không thể tạo profile, nhưng tài khoản đã được tạo',
//         details: error.message,
//       }),
//       {
//         status: 200, // cố tình 200
//         headers: { 'Content-Type': 'application/json' },
//       }
//     );
//   }
// }