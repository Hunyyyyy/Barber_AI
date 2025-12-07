// actions/history.actions.ts
"use server";

import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';


/**
 * Helper: Lấy User ID hiện tại
 */
async function getAuthenticatedUserId() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized: Vui lòng đăng nhập.");
  return user.id;
}

// ==========================================
// 1. LỊCH SỬ ĐẶT LỊCH (Booking)
// ==========================================
export async function getBookingHistory(page = 1, limit = 5) {
  try {
    const userId = await getAuthenticatedUserId();
    const skip = (page - 1) * limit;

    const [data, total] = await prisma.$transaction([
      prisma.queueTicket.findMany({
        where: { userId },
        orderBy: [{ date: 'desc' }, { ticketNumber: 'desc' }],
        skip,
        take: limit,
        include: {
          services: { include: { service: true } },
          barber: { select: { name: true, id: true } }
        }
      }),
      prisma.queueTicket.count({ where: { userId } })
    ]);

    return { success: true, data, total, totalPages: Math.ceil(total / limit) };
  } catch (error: any) {
    console.error("Error getting booking history:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBooking(ticketId: string) {
  try {
    const userId = await getAuthenticatedUserId();
    // Bảng TicketService có quan hệ với QueueTicket.
    // Cần xóa các record trong TicketService trước khi xóa QueueTicket.
    await prisma.$transaction(async (tx) => {
      await tx.ticketService.deleteMany({
        where: { ticketId: ticketId }
      });
      await tx.queueTicket.delete({
        where: { id: ticketId, userId }
      });
    });
    
    revalidatePath('/history');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    return { success: false, error: "Không thể xóa lịch sử này. Nó có thể đang được sử dụng ở nơi khác." };
  }
}

// ==========================================
// 2. LỊCH SỬ GIAO DỊCH (Transaction)
// ==========================================
export async function getTransactionHistory(page = 1, limit = 10) {
  try {
    const userId = await getAuthenticatedUserId();
    const skip = (page - 1) * limit;

    const whereClause = { userId, status: 'PAID' };

    const [data, total] = await prisma.$transaction([
      prisma.creditTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      // CORRECTED: Count must use the same where clause
      prisma.creditTransaction.count({ where: whereClause })
    ]);

    return { success: true, data, total, totalPages: Math.ceil(total / limit) };
  } catch (error: any) {
    console.error("Error getting transaction history:", error);
    return { success: false, error: "Lỗi tải giao dịch." };
  }
}

// Giao dịch không nên xóa, nhưng vẫn để hàm ở đây nếu cần.
export async function deleteTransaction(transId: string) {
    try {
        const userId = await getAuthenticatedUserId();
        await prisma.creditTransaction.delete({ where: { id: transId, userId } });
        revalidatePath('/history');
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting transaction:", error);
        return { success: false, error: "Không thể xóa giao dịch." };
    }
}

// ==========================================
// 3. LỊCH SỬ AI (AI History)
// ==========================================
export async function getAIHistory(page = 1, limit = 6) {
  try {
    const userId = await getAuthenticatedUserId();
    const skip = (page - 1) * limit;

    const [data, total] = await prisma.$transaction([
      prisma.hairAnalysis.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          generatedStyles: {
            select: { id: true, styleName: true, generatedImageUrl: true }
          }
        }
      }),
      prisma.hairAnalysis.count({ where: { userId } })
    ]);

    return { success: true, data, total, totalPages: Math.ceil(total / limit) };
  } catch (error: any) {
    console.error("Error getting AI history:", error);
    return { success: false, error: "Lỗi tải lịch sử AI." };
  }
}

export async function deleteAIHistory(analysisId: string) {
    try {
        const userId = await getAuthenticatedUserId();

        // CORRECTED: Use a transaction to delete children first
        await prisma.$transaction(async (tx) => {
          // Verify the user owns the parent analysis record
          const analysis = await tx.hairAnalysis.findUnique({
            where: { id: analysisId, userId },
            select: { id: true }
          });

          if (!analysis) {
            throw new Error("Không tìm thấy hoặc không có quyền xóa mục này.");
          }

          // 1. Delete all child `GeneratedStyle` records
          await tx.generatedStyle.deleteMany({
            where: { analysisId: analysisId },
          });

          // 2. Delete the parent `HairAnalysis` record
          await tx.hairAnalysis.delete({
            where: { id: analysisId },
          });
        });

        revalidatePath('/history');
        return { success: true };
    } catch (error: any) {
      console.error("Delete AI History Error:", error);
      return { success: false, error: error.message || "Không thể xóa mục này." };
    }
}

// ==========================================
// 4. BỘ SƯU TẬP (Collection)
// ==========================================
export async function getSavedCollection(page = 1, limit = 9) {
  try {
    const userId = await getAuthenticatedUserId();
    const skip = (page - 1) * limit;

    const [data, total] = await prisma.$transaction([
      prisma.savedHairstyle.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.savedHairstyle.count({ where: { userId } })
    ]);

    return { success: true, data, total, totalPages: Math.ceil(total / limit) };
  } catch (error: any) {
    console.error("Error getting saved collection:", error);
    return { success: false, error: "Lỗi tải bộ sưu tập." };
  }
}

export async function deleteSavedItem(itemId: string) {
    try {
        const userId = await getAuthenticatedUserId();

        // CORRECTED: Use a transaction to decouple relations before deleting
        await prisma.$transaction(async (tx) => {
          // Verify the user owns the item
          const item = await tx.savedHairstyle.findUnique({
            where: { id: itemId, userId },
            select: { id: true }
          });

          if (!item) {
            throw new Error("Không tìm thấy hoặc không có quyền xóa mục này.");
          }

          // 1. Decouple from any `QueueTicket` that references it
          await tx.queueTicket.updateMany({
            where: { targetStyleId: itemId },
            data: { targetStyleId: null },
          });

          // 2. Delete the `SavedHairstyle` item
          await tx.savedHairstyle.delete({
            where: { id: itemId },
          });
        });
        
        revalidatePath('/history');
        return { success: true };
    } catch (error: any)
    {
        console.error("Error deleting saved item:", error);
        return { success: false, error: error.message || "Không thể xóa khỏi bộ sưu tập." };
    }
}