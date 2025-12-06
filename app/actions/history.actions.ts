"use server";

import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Helper: Lấy User ID hiện tại và kiểm tra đăng nhập
 */
async function getAuthenticatedUserId() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized: Vui lòng đăng nhập để xem lịch sử.");
  }
  return user.id;
}

// ==========================================
// 1. LỊCH SỬ ĐẶT LỊCH / CẮT TÓC (Booking History)
// ==========================================
export async function getBookingHistory() {
  try {
    const userId = await getAuthenticatedUserId();

    const tickets = await prisma.queueTicket.findMany({
      where: { 
        userId: userId 
      },
      // Sắp xếp: Mới nhất lên đầu
      orderBy: [
        { date: 'desc' },
        { ticketNumber: 'desc' }
      ],
      // Lấy kèm thông tin dịch vụ và thợ
      include: {
        services: {
          include: {
            service: true // Lấy tên, giá của dịch vụ
          }
        },
        barber: {
          select: {
            name: true,
            id: true
          }
        }
      }
    });

    return { success: true, data: tickets };

  } catch (error: any) {
    console.error("Get Booking History Error:", error);
    return { success: false, error: error.message || "Lỗi khi tải lịch sử đặt lịch." };
  }
}

// ==========================================
// 2. LỊCH SỬ THANH TOÁN / NẠP CREDIT (Transaction History)
// ==========================================
export async function getTransactionHistory() {
  try {
    const userId = await getAuthenticatedUserId();

    // Lấy lịch sử nạp tiền (Mua Credit)
    const creditTransactions = await prisma.creditTransaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: creditTransactions };

  } catch (error: any) {
    console.error("Get Transaction History Error:", error);
    return { success: false, error: "Lỗi khi tải lịch sử giao dịch." };
  }
}

// ==========================================
// 3. LỊCH SỬ AI ANALYZE & GENERATE (AI History)
// ==========================================
export async function getAIHistory() {
  try {
    const userId = await getAuthenticatedUserId();

    const history = await prisma.hairAnalysis.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        // Lấy kèm danh sách các ảnh đã generate từ lần phân tích này
        generatedStyles: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            styleName: true,
            generatedImageUrl: true,
            createdAt: true
          }
        }
      }
    });

    return { success: true, data: history };

  } catch (error: any) {
    console.error("Get AI History Error:", error);
    return { success: false, error: "Lỗi khi tải lịch sử AI." };
  }
}

// ==========================================
// 4. (BONUS) LẤY BỘ SƯU TẬP ĐÃ LƯU (Saved Collection)
// ==========================================
export async function getSavedCollection() {
    try {
      const userId = await getAuthenticatedUserId();
  
      const collection = await prisma.savedHairstyle.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
      });
  
      return { success: true, data: collection };
  
    } catch (error: any) {
      console.error("Get Collection Error:", error);
      return { success: false, error: "Lỗi khi tải bộ sưu tập." };
    }
  }