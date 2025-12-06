"use server";

import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PaymentMethod } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function confirmPayment(ticketId: string, method: PaymentMethod) {
  try {
    // 1. Check quyền (Chỉ Admin/Barber mới được xác nhận tiền đã về)
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // 2. Cập nhật Database
    // Sử dụng transaction để đảm bảo tính toàn vẹn
    await prisma.$transaction(async (tx) => {
        // Cập nhật thông tin thanh toán
        await tx.queueTicket.update({
            where: { id: ticketId },
            data: {
                isPaid: true,
                paymentMethod: method,
                paidAt: new Date(),
                status: 'PAID' // Trạng thái này sẽ loại khách khỏi queue list
            }
        });

        // Tìm Barber đang phụ trách vé này để set trạng thái rảnh (Free)
        const ticket = await tx.queueTicket.findUnique({ where: { id: ticketId } });
        if (ticket?.barberId) {
            await tx.barber.update({
                where: { id: ticket.barberId },
                data: { isBusy: false }
            });
        }
    });

    // 3. Revalidate để cập nhật UI Realtime
    revalidatePath('/queue');
    revalidatePath('/admin/queue');

    return { success: true, message: 'Thanh toán thành công!' };

  } catch (error) {
    console.error("Payment Error in payment.action:", error);
    return { success: false, error: 'Lỗi khi xử lý thanh toán' };
  }
}
