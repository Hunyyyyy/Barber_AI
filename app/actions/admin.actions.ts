// app/actions/admin.actions.ts
"use server";
import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { serviceSchema, updateShopSettingsSchema } from '@/lib/validation';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
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

export async function updateShopSettings(prevState: any, formData: FormData) {
  try {
    // 1. Kiểm tra quyền quản trị
    await checkAdmin(); 

    // 2. Chuẩn bị dữ liệu từ FormData
    const rawData = {
      morningOpen: formData.get('morningOpen'),
      morningClose: formData.get('morningClose'),
      afternoonOpen: formData.get('afternoonOpen'),
      afternoonClose: formData.get('afternoonClose'),
      maxDailyTickets: formData.get('maxDailyTickets'),
      isShopOpen: formData.get('isShopOpen') === 'on',
      bankName: formData.get('bankName'),
      bankAccountNo: formData.get('bankAccountNo'),
      bankAccountName: formData.get('bankAccountName'),
      qrTemplate: formData.get('qrTemplate'), // <--- Thêm trường Mẫu QR
    };

    // 3. Xác thực dữ liệu
    const validationResult = updateShopSettingsSchema.safeParse(rawData);

    if (!validationResult.success) {
      // Xử lý lỗi từ Zod
      const formattedErrors = validationResult.error.issues.map(issue => issue.message).join('; ');
      return { success: false, error: formattedErrors || "Dữ liệu nhập vào không hợp lệ." };
    }
    
    // Dữ liệu đã được xác thực và định dạng
    const data = {
      ...validationResult.data,
      // Cần chuyển đổi lại isShopOpen vì Zod chỉ kiểm tra sự tồn tại (string)
      isShopOpen: rawData.isShopOpen, 
      maxDailyTickets: validationResult.data.maxDailyTickets, // Đảm bảo là số
    };
    
    // 4. Lưu dữ liệu vào Database
    await prisma.shopSetting.upsert({
      where: { id: '1' },
      update: data as any, // Sử dụng 'any' tạm thời nếu bạn chưa đồng bộ hóa type chính xác
      create: { id: '1', ...data } as any,
    });

    // 5. Revalidate
    revalidatePath('/admin');
    
    return { success: true, message: "Cập nhật cài đặt thành công!" };

  } catch (error: any) {
    console.error("Update Shop Settings Error:", error);
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return { success: false, error: "Bạn không có quyền quản trị." };
    }
    // Xử lý lỗi Zod nếu nó chưa bị bắt ở trên (ít xảy ra)
    if (error instanceof z.ZodError) {
        return { success: false, error: "Lỗi xác thực dữ liệu đầu vào." };
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
    // 1. Kiểm tra quyền
    await checkAdmin();
    
    // 2. Chuẩn bị dữ liệu thô (Raw Data)
    const rawData = {
      id: formData.get('id'),
      name: formData.get('name'),
      price: formData.get('price'),
      durationWork: formData.get('durationWork'),
      durationWait: formData.get('durationWait'),
      // isActive được xử lý ngoài Zod do cách FormData trả về giá trị 'on'
      isActive: formData.get('isActive') === 'on', 
    };

    // 3. Validation bằng Zod
    // Chúng ta chỉ parse các trường không phải boolean trong Zod
    const validationResult = serviceSchema.safeParse(rawData);

    if (!validationResult.success) {
      // Gộp các thông báo lỗi Zod thành một chuỗi dễ đọc
      const errorMessages = validationResult.error.issues.map(issue => {
        // Lấy tên trường và thông báo lỗi
        const fieldName = String(issue.path[0]);
        return `${fieldName}: ${issue.message}`;
      }).join('; ');

      return { success: false, error: errorMessages };
    }

    // Dữ liệu đã sạch (bao gồm cả trường default cho durationWait)
    const validatedData = validationResult.data;
    
    // Dữ liệu cuối cùng để lưu vào DB (kết hợp isActive)
    const dataToSave = {
        name: validatedData.name,
        price: validatedData.price,
        durationWork: validatedData.durationWork,
        durationWait: validatedData.durationWait,
        isActive: rawData.isActive, // Dùng giá trị boolean đã xử lý
    };
    
    const serviceId = validatedData.id;

    // 4. Upsert (Tạo mới hoặc Cập nhật)
    if (serviceId) {
      // Cập nhật
      await prisma.service.update({ 
        where: { id: serviceId }, 
        data: dataToSave 
      });
    } else {
      // Thêm mới
      await prisma.service.create({ 
        data: dataToSave 
      });
    }

    // 5. Revalidate
    revalidatePath('/admin/services');
    
    return { success: true, message: serviceId ? "Cập nhật thành công!" : "Thêm mới thành công!" };

  } catch (error: any) {
    console.error("admin.actions upsertService", error);
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
        return { success: false, error: "Bạn không có quyền quản trị." };
    }
    return { success: false, error: "Lỗi hệ thống khi lưu dịch vụ" };
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
    try {
        await checkAdmin();

        // Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu
        await prisma.$transaction(async (tx) => {
            // 1. Cập nhật Role trong bảng User
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { role: newRole }
            });

            // 2. Logic đồng bộ bảng Barber
            if (newRole === 'BARBER') {
                // Nếu lên chức BARBER -> Thêm vào bảng Barber
                // Dùng upsert: Nếu chưa có thì tạo, có rồi thì cập nhật active
                await tx.barber.upsert({
                    where: { userId: userId },
                    create: {
                        userId: userId,
                        name: updatedUser.fullName || 'Thợ mới', // Lấy tên từ User
                        isActive: true,
                        isBusy: false
                    },
                    update: {
                        isActive: true, // Kích hoạt lại nếu trước đó đã bị ẩn
                        // name: updatedUser.fullName // Có thể cập nhật lại tên nếu muốn
                    }
                });
            } else {
                // Nếu chuyển từ BARBER xuống USER/ADMIN -> Xóa khỏi bảng Barber (hoặc set isActive: false)
                // Ở đây mình chọn xóa để danh sách thợ sạch sẽ
                try {
                    await tx.barber.delete({
                        where: { userId: userId }
                    });
                } catch (e) {
                    // Bỏ qua lỗi nếu user này chưa từng là Barber
                }
            }
        });

        // 3. Cập nhật Supabase Auth (Metadata) - Không đổi
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!, 
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { role: newRole }
        });
        
        revalidatePath('/admin/users'); // Làm mới cache trang admin users
        return { success: true };

    } catch (error) {
        console.error("Update Role Error:", error);
        return { success: false, error: "Lỗi khi cập nhật quyền." };
    }
}

// --- 6. LẤY DANH SÁCH USER (Sửa lại để hỗ trợ search luôn nếu muốn) ---
export async function getAllUsers() {
    await checkAdmin();
    // Lấy 50 user mới nhất
    return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50, 
        select: { id: true, fullName: true, email: true, phone: true, role: true, createdAt: true }
    });
}