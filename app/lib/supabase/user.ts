// lib/data/user.ts
import { getUser } from '@/lib/supabase/auth'; // Hàm bạn đã có
import { prisma } from '@/lib/supabase/prisma/db'; // Đảm bảo bạn đã khởi tạo prisma client

export async function getCurrentUserRole() {
  // 1. Lấy user từ Supabase Auth
  const authUser = await getUser();
  if (!authUser) return null;

  // 2. Dùng ID đó để tìm trong bảng User của Prisma
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true, id: true, fullName: true } // Chỉ lấy field cần thiết
  });

  return dbUser?.role || null; // Trả về 'ADMIN', 'BARBER' hoặc 'USER'
}