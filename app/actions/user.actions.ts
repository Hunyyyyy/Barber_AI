"use server";

import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { FaceShape } from '@prisma/client'; // Import Enum từ Prisma để type safe
import { revalidatePath } from 'next/cache';

/**
 * Lấy số dư Credit (Lượt dùng AI)
 */
export async function getUserCredits() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return 0;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { credits: true },
  });

  return dbUser?.credits || 0;
}

/**
 * Lấy toàn bộ thông tin User hiện tại
 * Dùng cho trang Profile hoặc Header
 */
export async function getUserInfo() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    return dbUser;
  } catch (error) {
    console.error("Get User Error:", error);
    return null;
  }
}

/**
 * Cập nhật thông tin User
 * Hỗ trợ cập nhật: Tên, SĐT, Avatar, Dáng mặt
 */
export async function uploadUserAvatar(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Vui lòng đăng nhập" };

  const file = formData.get('file') as File;
  if (!file) return { success: false, error: "Không tìm thấy file ảnh" };

  // 1. Tạo tên file unique (userId + timestamp)
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  try {
    // 2. Upload lên Supabase Storage (Bucket 'avatars')
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 3. Lấy Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // 4. Gọi hàm updateUserInfo để lưu URL vào DB & Metadata
    return await updateUserInfo({ avatarUrl: publicUrl });

  } catch (error: any) { // Thêm : any để truy cập message
    console.error("Upload Avatar Error Details:", error); // Xem log ở Terminal Server
    
    // Trả về lỗi chi tiết cho Client xem
    return { 
        success: false, 
        error: error.message || "Lỗi upload ảnh (Xem server log)" 
    };
  }
}

/**
 * HÀM CŨ (Đã sửa): Cập nhật thông tin User
 */
export async function updateUserInfo(data: {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  faceShape?: FaceShape;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Vui lòng đăng nhập" };

  try {
    // 1. Cập nhật vào Database chính (PostgreSQL)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { ...data },
    });

    // 2. Cập nhật Metadata bên Supabase Auth
    const updateData: any = {};
    if (data.fullName) updateData.full_name = data.fullName; // Supabase dùng chuẩn 'full_name'
    if (data.phone) updateData.phone = data.phone;
    if (data.avatarUrl) updateData.avatar_url = data.avatarUrl; // Supabase dùng chuẩn 'avatar_url'

    if (Object.keys(updateData).length > 0) {
        await supabase.auth.updateUser({
            data: updateData // Metadata nằm trong object `data`
        });
    }

    // 3. Revalidate
    revalidatePath('/profile');
    revalidatePath('/home');
    revalidatePath('/', 'layout'); // Refresh Header để hiện Avatar mới ngay lập tức

    return { success: true, user: updatedUser, message: "Cập nhật thành công!" };
  } catch (error) {
    console.error("Update User Error:", error);
    return { success: false, error: "Lỗi khi cập nhật thông tin." };
  }
}