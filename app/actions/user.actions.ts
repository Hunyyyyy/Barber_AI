"use server";
import { getUser } from '@/lib/supabase/auth';
import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { UpdateUserSchema } from '@/lib/validation';
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
// Hàm phụ trợ kiểm tra Magic Bytes
async function validateImageFile(file: File): Promise<boolean> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Kiểm tra header của file (Magic Numbers)
  // JPG/JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  
  // WebP: ... 57 45 42 50
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;

  return false;
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
  
  if (file.size > 5 * 1024 * 1024) return { success: false, error: "Ảnh quá lớn (>5MB)" }; // Giới hạn 5MB
  const isValidImage = await validateImageFile(file);
  if (!isValidImage) {
    return { success: false, error: "File không hợp lệ hoặc bị lỗi. Chỉ chấp nhận JPG, PNG, GIF." };
  }
  const fileExt = file.name.split('.').pop(); 
  // Chỉ cho phép các đuôi an toàn
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt?.toLowerCase() || '')) {
     return { success: false, error: "Định dạng file không được hỗ trợ." };
  }
  // 1. Tạo tên file unique (userId + timestamp)
  const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${fileName}`;

  try {
    // 2. Upload lên Supabase Storage (Bucket 'avatars')
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { 
        upsert: true,
        contentType: file.type // Đảm bảo content-type đúng
      });

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
        error:  "Lỗi tải ảnh lên, vui lòng thử lại sau." 
    };
  }
}

/**
 * HÀM CŨ (Đã sửa): Cập nhật thông tin User
 */
/**
 * Cập nhật thông tin User
 * Đồng bộ giữa Prisma Database và Supabase Auth Metadata
 */
export async function updateUserInfo(data: {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  faceShape?: FaceShape;
}) {
  const validated = UpdateUserSchema.safeParse(data);
  if (!validated.success) {
    const firstError = Object.values(validated.error.flatten().fieldErrors)[0]?.[0] || 'Dữ liệu không hợp lệ';
    return { success: false, error: firstError };
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Vui lòng đăng nhập" };

  try {
    // BƯỚC 1: Cập nhật vào Database chính (PostgreSQL qua Prisma)
    // Chúng ta cập nhật DB trước để đảm bảo dữ liệu quan trọng nhất được lưu
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { ...data },
    });

    // BƯỚC 2: Cập nhật Metadata bên Supabase Auth (ĐỒNG BỘ)
    // Việc này giúp session bên client (nếu dùng useUser của Supabase) cập nhật ngay lập tức
    const metadataUpdates: any = {};
    
    // Mapping tên trường từ Prisma (camelCase) sang chuẩn Supabase (snake_case)
    if (data.fullName) metadataUpdates.full_name = data.fullName; 
    if (data.avatarUrl) metadataUpdates.avatar_url = data.avatarUrl;
    // Lưu số điện thoại vào metadata để hiển thị (không phải đổi SĐT đăng nhập)
    if (data.phone) metadataUpdates.phone = data.phone; 
    // Role cũng nên được giữ đồng bộ nếu có thay đổi (ở đây lấy từ DB ra cho chắc)
    metadataUpdates.role = updatedUser.role;

    // Chỉ gọi API update của Supabase nếu có trường cần cập nhật
    if (Object.keys(metadataUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({
            data: metadataUpdates // Lưu ý: Metadata nằm trong object `data`
        });

        if (authError) {
            console.warn("Cảnh báo: Không thể đồng bộ Supabase Auth Metadata:", authError.message);
            // Không throw lỗi ở đây để tránh rollback DB nếu chỉ lỗi metadata
        }
    }

    // BƯỚC 3: Revalidate Cache để UI cập nhật ngay
    revalidatePath('/profile');
    revalidatePath('/home');
    revalidatePath('/', 'layout'); // Refresh Header để hiện Avatar/Tên mới ngay lập tức

    return { success: true, user: updatedUser, message: "Cập nhật thành công!" };
  } catch (error) {
    console.error("Update User Error:", error);
    return { success: false, error: "Lỗi khi cập nhật thông tin." };
  }
}
export async function getCurrentUserRoleAction() {
  try {
    // 1. Lấy user từ Supabase Auth (Chạy trên server)
    const authUser = await getUser();
    if (!authUser) return null;

    // 2. Dùng ID đó để tìm trong bảng User của Prisma
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true }
    });

    return dbUser?.role || null;
  } catch (error) {
    console.error("Error fetching role:", error);
    return null;
  }
}