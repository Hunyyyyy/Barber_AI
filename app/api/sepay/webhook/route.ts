import { prisma } from '@/lib/supabase/prisma/db';
import { NextResponse } from 'next/server';
// Định nghĩa kiểu dữ liệu SePay gửi về
interface SePayTransaction {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  code: string | null;
  content: string;
  transferType: string;
  description: string;
  transferAmount: number;
  referenceCode: string;
}

export async function POST(req: Request) {
  try {
    // 1. Auth check (giữ nguyên)
     const apiKey = req.headers.get('Authorization'); 
    if (apiKey !== `Apikey ${process.env.INTERNAL_API_SECRET}`) {
       
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body: SePayTransaction = await req.json();
    const { content, transferAmount } = body;

    // ============================================================
    // CASE 1: THANH TOÁN VÉ (Cú pháp: BARBER 123)
    // ============================================================
    const barberMatch = content.match(/BARBER\s*(\d+)/i);
    
    if (barberMatch) {
        const ticketNumber = parseInt(barberMatch[1]);

        // [SỬA] Lấy ngày hôm nay theo giờ Việt Nam để lọc
        const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
        const startOfToday = new Date(todayVN);

        // Tìm vé active CỦA HÔM NAY
        const ticket = await prisma.queueTicket.findFirst({
            where: { 
                ticketNumber: ticketNumber,
                // [THÊM] Điều kiện ngày tháng: Phải lớn hơn hoặc bằng 00:00 hôm nay
                date: { gte: startOfToday }, 
                isPaid: false,
                status: { in: ['COMPLETED', 'SERVING', 'FINISHING', 'WAITING', 'CALLING', 'PROCESSING'] },
            },
            include: { services: true }
        });

        if (!ticket) {
            // Log thêm để debug xem tại sao không thấy
            console.log(`⚠️ Ticket #${ticketNumber} not found for date >= ${todayVN}`);
            return NextResponse.json({ success: true, message: 'Vé không tồn tại hoặc đã xong' });
        }

        // [LOGIC MỚI] Tính toán cộng dồn
        const previousPaid = ticket.amountPaid || 0;
        const currentTotalPaid = previousPaid + transferAmount;
        const isEnough = currentTotalPaid >= ticket.totalPrice; // Đủ hoặc Dư đều OK

        await prisma.$transaction(async (tx) => {
            if (isEnough) {
                // === TRƯỜNG HỢP 1: ĐỦ TIỀN HOẶC DƯ ===
                const hasHaircutService = ticket.services.some(s => s.serviceId === 'CUT'); // ID service cắt tóc

                // A. Update Ticket thành PAID
                await tx.queueTicket.update({
                    where: { id: ticket.id },
                    data: {
                        isPaid: true,
                        status: 'PAID',
                        paymentMethod: 'BANK_TRANSFER',
                        completedAt: new Date(),
                        paidAt: new Date(),
                        amountPaid: currentTotalPaid // Lưu tổng tiền (kể cả phần dư)
                    }
                });

                // B. Tặng Credit (nếu có cắt tóc)
                if (ticket.userId && hasHaircutService) {
                    await tx.user.update({
                        where: { id: ticket.userId },
                        data: { credits: { increment: 1 } }
                    });
                }

                // C. Giải phóng thợ
                if (ticket.barberId) {
                    await tx.barber.update({
                        where: { id: ticket.barberId },
                        data: { isBusy: false }
                    });
                }
            } else {
                // === TRƯỜNG HỢP 2: THIẾU TIỀN ===
                // Chỉ cập nhật số tiền đã đóng, KHÔNG đổi status thành PAID
                await tx.queueTicket.update({
                    where: { id: ticket.id },
                    data: {
                        amountPaid: currentTotalPaid 
                    }
                });
                // Tiền vẫn vào túi bạn, nhưng vé chưa "Xong". 
                // Client sẽ polling thấy amountPaid tăng lên nhưng isPaid vẫn false -> Hiển thị thông báo thiếu tiền.
            }
        });

        return NextResponse.json({ success: true, message: 'Xử lý thanh toán thành công' });
    }

    // ============================================================
    // CASE 2: NẠP CREDIT (Cú pháp: NAP123456)
    // ============================================================
   // SỬA: Thay /NAP\d+/i bằng /NAP[A-Z0-9]+/i để bắt cả chữ và số
    const napMatch = content.match(/NAP[A-Z0-9]+/i); 

    if (napMatch) {
        const code = napMatch[0].toUpperCase();
        
        // Thêm log để debug xem bắt được mã gì
        console.log("DEBUG: Extracted Code:", code);

        const order = await prisma.creditTransaction.findUnique({
            where: { code, status: 'PENDING' }
        });

        if (!order) {
            console.log("DEBUG: Order not found for code:", code);
            return NextResponse.json({ success: false, message: 'Đơn nạp không tồn tại' });
        }

        if (transferAmount < order.amount) {
            return NextResponse.json({ success: false, message: 'Nạp thiếu tiền' });
        }

        // Update DB
        await prisma.$transaction([
            prisma.creditTransaction.update({
                where: { id: order.id },
                data: { status: 'PAID' }
            }),
            prisma.user.update({
                where: { id: order.userId },
                data: { credits: { increment: order.credits } }
            })
        ]);

        return NextResponse.json({ success: true, message: 'Nạp credit thành công' });
    } 
    }catch (error) {
    console.error('SePay Webhook Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}