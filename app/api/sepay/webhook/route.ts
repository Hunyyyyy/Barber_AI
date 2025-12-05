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
    // 1. (Tuỳ chọn) Kiểm tra bảo mật API Key
    const apiKey = req.headers.get('Authorization'); 
    if (apiKey !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
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

        // 3. Tìm vé trong Database (Kèm thông tin Services để check loại dịch vụ)
        const ticket = await prisma.queueTicket.findFirst({
            where: { 
                ticketNumber: ticketNumber,
                isPaid: false,
                status: { in: ['COMPLETED', 'SERVING', 'FINISHING', 'WAITING', 'CALLING', 'PROCESSING'] },
            },
            // [QUAN TRỌNG] Lấy thêm danh sách dịch vụ để kiểm tra
            include: {
                services: true 
            }
        });

        if (!ticket) {
            return NextResponse.json({ success: false, message: 'Vé không tồn tại hoặc đã thanh toán' });
        }

        // 4. Kiểm tra số tiền
        if (transferAmount < ticket.totalPrice) {
            return NextResponse.json({ success: false, message: 'Chuyển thiếu tiền' });
        }

        // [LOGIC MỚI] Kiểm tra xem vé này có dịch vụ CẮT TÓC (id='CUT') hay không?
        // Lưu ý: 'CUT' là ID bạn đã seed trong database. Nếu ID khác thì sửa lại ở đây.
        const hasHaircutService = ticket.services.some(s => s.serviceId === 'CUT');

        // 5. Cập nhật trạng thái vé -> PAID
        await prisma.$transaction(async (tx) => {
            // A. Cập nhật vé
            await tx.queueTicket.update({
                where: { id: ticket.id },
                data: {
                    isPaid: true,
                    status: 'PAID',
                    paymentMethod: 'BANK_TRANSFER',
                    paidAt: new Date(),
                }
            });

            // B. Tặng Credit (CHỈ KHI CÓ CẮT TÓC & CÓ TÀI KHOẢN)
            if (ticket.userId && hasHaircutService) {
                await tx.user.update({
                    where: { id: ticket.userId },
                    data: { credits: { increment: 1 } } // Tặng 1 lượt
                });
            }

            // C. Giải phóng thợ
            if (ticket.barberId) {
                await tx.barber.update({
                    where: { id: ticket.barberId },
                    data: { isBusy: false }
                });
            }
        });

        return NextResponse.json({ success: true, message: 'Thanh toán vé thành công' });
    }

    // ============================================================
    // CASE 2: NẠP CREDIT (Cú pháp: NAP123456)
    // ============================================================
    const napMatch = content.match(/NAP\d+/i);
    if (napMatch) {
        const code = napMatch[0].toUpperCase();

        const order = await prisma.creditTransaction.findUnique({
            where: { code, status: 'PENDING' }
        });

        if (!order) return NextResponse.json({ success: false, message: 'Đơn nạp không tồn tại' });
        if (transferAmount < order.amount) return NextResponse.json({ success: false, message: 'Nạp thiếu tiền' });

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

    return NextResponse.json({ success: false, message: 'Sai cú pháp hoặc không tìm thấy đơn' });

  } catch (error) {
    console.error('SePay Webhook Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}