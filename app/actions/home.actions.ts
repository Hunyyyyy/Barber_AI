"use server";

import { prisma } from '@/lib/supabase/prisma/db';

/**
 * Lấy toàn bộ dữ liệu cần thiết cho trang chủ
 * Sử dụng Promise.all để tối ưu hiệu năng
 */
export async function getHomePageData() {
  try {
    // Chạy song song 4 truy vấn
    const [settings, services, barbers, owner] = await Promise.all([
      
      // 1. Lấy cài đặt Shop (Giờ mở cửa, Trạng thái)
      prisma.shopSetting.findUnique({ 
        where: { id: '1' } 
      }),

      // 2. Lấy danh sách dịch vụ (đang hoạt động)
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      }),

      // 3. Lấy danh sách thợ (Barber model)
      // Lưu ý: Dựa trên queue.actions.ts bạn gửi, hệ thống dùng bảng 'Barber' riêng để quản lý xếp hàng
      prisma.barber.findMany({
        where: { isActive: true }, // Chỉ lấy thợ đang đi làm
        orderBy: { name: 'asc' }
      }),

      // 4. Lấy thông tin Chủ quán (User có role ADMIN)
      prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: {
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true
        }
      })
    ]);

    // Format lại dữ liệu trả về
    return {
      shopName: "Barber Shop PRO", // Tên quán (Có thể lưu trong DB hoặc hardcode)
      address: "123 Đường Cắt Tóc, Quận 1, TP.HCM", // Địa chỉ giả lập
      settings: settings || {
        morningOpen: '08:00', morningClose: '12:00',
        afternoonOpen: '13:30', afternoonClose: '18:00',
        isShopOpen: true
      },
      services,
      barbers,
      owner: owner || { fullName: 'Chủ Quán', phone: 'Hotline: 0999.888.777' }
    };

  } catch (error) {
    console.error("Lỗi lấy dữ liệu trang chủ:", error);
    return null;
  }
}