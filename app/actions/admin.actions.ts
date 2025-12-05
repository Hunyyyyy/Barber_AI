// app/actions/admin.actions.ts
"use server";

import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
// --- MIDDLEWARE CHECK QUYỀN ADMIN ---
async function checkAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check role trong DB chính
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (dbUser?.role !== 'ADMIN') {
    throw new Error("Forbidden: Bạn không có quyền truy cập");
  }
  return true;
}

// --- 1 & 2 & 3: QUẢN LÝ CÀI ĐẶT QUÁN (Giờ, Số khách tối đa) ---

export async function getShopSettings() {
  // Không cần check admin để lấy data hiển thị, nhưng update thì cần
  return await prisma.shopSetting.findUnique({ where: { id: '1' } });
}

export async function updateShopSettings(prevState: any ,formData: FormData) {
  try {
    await checkAdmin(); // Kiểm tra quyền truy cập

    const maxDailyTicketsRaw = formData.get('maxDailyTickets') as string;
    const maxDailyTickets = parseInt(maxDailyTicketsRaw);

    // 1. LOGIC KIỂM TRA DỮ LIỆU ĐẦU VÀO
    if (isNaN(maxDailyTickets) || maxDailyTickets < 1) {
      return { success: false, error: "Số lượng khách tối đa phải là số nguyên dương." };
    }
    
    // 2. CHUẨN BỊ DỮ LIỆU
    const data = {
      morningOpen: formData.get('morningOpen') as string,
      morningClose: formData.get('morningClose') as string,
      afternoonOpen: formData.get('afternoonOpen') as string,
      afternoonClose: formData.get('afternoonClose') as string,
      maxDailyTickets: maxDailyTickets,
      isShopOpen: formData.get('isShopOpen') === 'on',
    };
    
    // 3. THAO TÁC DATABASE
    await prisma.shopSetting.upsert({
      where: { id: '1' },
      update: data,
      create: { id: '1', ...data },
    });

    revalidatePath('/admin');
    // Trả về message để UI hiển thị thông báo thành công
    return { success: true, message: "Cập nhật cài đặt thành công!" };

  } catch (error: any) {
    console.error("Update Shop Settings Error:", error);
    
    // Xử lý lỗi quyền truy cập và lỗi chung
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
        return { success: false, error: "Bạn không có quyền quản trị." };
    }
    return { success: false, error: "Lỗi hệ thống khi lưu cài đặt." };
  }
}

// --- 4. QUẢN LÝ DỊCH VỤ (Giá, Thời gian làm) ---

export async function getAdminServices() {
  // Lấy tất cả kể cả ẩn
  return await prisma.service.findMany({ orderBy: { name: 'asc' } });
}

export async function upsertService(prevState: any, formData: FormData) {
  try {
    await checkAdmin();
    
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const priceRaw = formData.get('price') as string;
    const durationWorkRaw = formData.get('durationWork') as string;
    const durationWaitRaw = formData.get('durationWait') as string || '0';
    const isActive = formData.get('isActive') === 'on';

    // Validate cơ bản
    if (!name || name.trim().length === 0) {
      return { success: false, error: "Tên dịch vụ không được để trống" };
    }
    
    const price = parseInt(priceRaw);
    const durationWork = parseInt(durationWorkRaw);
    const durationWait = parseInt(durationWaitRaw);

    if (isNaN(price) || price < 0) return { success: false, error: "Giá tiền không hợp lệ" };
    if (isNaN(durationWork) || durationWork <= 0) return { success: false, error: "Thời gian làm phải lớn hơn 0" };

    const data = { name, price, durationWork, durationWait, isActive };

    if (id) {
      await prisma.service.update({ where: { id }, data });
    } else {
      await prisma.service.create({ data });
    }

    revalidatePath('/admin/services');
    return { success: true, message: id ? "Cập nhật thành công!" : "Thêm mới thành công!" };

  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message || "Lỗi hệ thống khi lưu dịch vụ" };
  }
}

export async function deleteService(id: string) {
  try {
    await checkAdmin();
    await prisma.service.delete({ where: { id } });
    revalidatePath('/admin/services');
    return { success: true, message: "Đã xóa dịch vụ" };
  } catch (e) {
    return { success: false, error: "Không thể xóa dịch vụ đã có lịch sử giao dịch. Hãy ẩn nó đi." };
  }
}

// --- 5. QUẢN LÝ USER & ROLE ---

export async function searchUsers(query: string) {
  await checkAdmin();
  if (!query) return [];
  
  return await prisma.user.findMany({
    where: {
      OR: [
        { phone: { contains: query } },
        { fullName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 10,
  });
}

export async function updateUserRole(userId: string, newRole: 'ADMIN' | 'BARBER' | 'USER') {
    // 1. Cập nhật DB chính (Prisma)
    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole }
    });

    // 2. Cập nhật Supabase Auth (Metadata)
    // Cần dùng Service Role Key (trong .env.local) để có quyền sửa user khác
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, 
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole }
    });
    
    return { success: true };
}