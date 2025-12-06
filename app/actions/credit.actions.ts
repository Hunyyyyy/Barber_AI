"use server";
import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// [PHIÊN BẢN CẢI TIẾN]
export async function createTopUpOrder(amount: number, credits: number) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    let order = null;
    let uniqueCode = '';
    const MAX_RETRIES = 5; 

    // 1. INPUT VALIDATION (Bảo mật: Tránh nhập số âm/số 0)
    if (!Number.isInteger(amount) || amount <= 0) {
        return { success: false, error: "Số tiền nạp phải là số nguyên dương." };
    }
    if (!Number.isInteger(credits) || credits <= 0) {
        return { success: false, error: "Số Credits phải là số nguyên dương." };
    }

    // 2. VÒNG LẶP XỬ LÝ TRÙNG LẶP CODE (Collision Handling)
    for (let i = 0; i < MAX_RETRIES; i++) {
        // Sử dụng một hàm tạo code mạnh hơn (VD: NAP + 8 ký tự ngẫu nhiên)
        // Thay thế logic Date.now() yếu kém
        uniqueCode = `NAP${Math.random().toString(36).substring(2, 10).toUpperCase()}`; 
        
        try {
            order = await prisma.creditTransaction.create({
                data: {
                    userId: user.id,
                    amount,
                    credits,
                    code: uniqueCode,
                    status: 'PENDING'
                }
            });
            // Nếu tạo thành công, thoát khỏi vòng lặp
            break; 
        } catch (e) {
            // Kiểm tra lỗi có phải do trùng khóa UNIQUE (P2002 trong Prisma) không
            // Nếu trùng, tiếp tục vòng lặp để tạo code mới
            if (i === MAX_RETRIES - 1) {
                 console.error("Failed to generate unique code after max retries.", e);
                 return { success: false, error: "Lỗi hệ thống: Không thể tạo mã giao dịch duy nhất." };
            }
            // Optional: Chờ một chút trước khi thử lại
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // Đảm bảo đơn hàng đã được tạo thành công
    if (!order) {
        return { success: false, error: "Lỗi hệ thống không xác định. Vui lòng thử lại." };
    }

    return { success: true, order };
}