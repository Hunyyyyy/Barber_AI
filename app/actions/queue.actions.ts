"use server";

import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUserRole } from '@/lib/supabase/user';
import { TicketStatus } from '@prisma/client'; // Import Enum từ Prisma
import { revalidatePath } from 'next/cache';
// --- HELPER FUNCTIONS ---

// Lấy cài đặt cửa hàng
export async function getShopSettings() {
  return await prisma.shopSetting.findUnique({ where: { id: '1' } });
}

// Kiểm tra sức chứa (Capacity Check)
async function checkShopCapacity(date: Date) {
  const settings = await getShopSettings();
  if (!settings) throw new Error('Cấu hình cửa hàng không tồn tại');
  if (!settings.isShopOpen) throw new Error('Cửa hàng hiện đang đóng cửa');

  // 1. Kiểm tra giới hạn số khách trong ngày
  // Đếm các vé có ngày trùng khớp và trạng thái không phải là Hủy hoặc Đã thanh toán
  const dailyCount = await prisma.queueTicket.count({
    where: { 
      date: { equals: date }, 
      status: { notIn: ['CANCELLED', 'PAID', 'SKIPPED'] } 
    },
  });

  if (dailyCount >= settings.maxDailyTickets) {
    throw new Error('Đã đạt giới hạn số lượng khách trong ngày');
  }

  return true;
}

// Lấy số thứ tự tiếp theo trong ngày
async function getNextTicketNumber(date: Date) {
  const lastTicket = await prisma.queueTicket.findFirst({
    where: { date: { equals: date } },
    orderBy: { ticketNumber: 'desc' },
  });
  return (lastTicket?.ticketNumber || 0) + 1;
}

// Tính tổng tiền và thời gian dự kiến từ danh sách Service ID
async function calculateTicketDetails(serviceIds: string[]) {
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
  });

  // Tính tổng (Sử dụng hàm getFinalPrice)
  const totalPrice = services.reduce((sum, svc) => sum + getFinalPrice(svc), 0);
  
  const totalWorkDuration = services.reduce((sum, svc) => sum + svc.durationWork, 0);

  return { services, totalPrice, totalWorkDuration };
}

// --- MAIN ACTIONS ---
/**
 * Hủy vé xếp hàng
 */
export async function cancelQueueTicket(ticketId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Tìm vé
  const ticket = await prisma.queueTicket.findUnique({ 
    where: { id: ticketId },
    include: { user: true } // để check quyền sở hữu
  });

  if (!ticket) return { success: false, error: 'Không tìm thấy vé' };

  // Check quyền: Chỉ chủ vé hoặc Admin mới được hủy
  // Lưu ý: user.id của supabase khớp với ticket.userId
  const isOwner = ticket.userId === user.id;
  const isAdmin = user.user_metadata?.role === 'ADMIN'; // Hoặc query bảng User để check role

  if (!isOwner && !isAdmin) {
    return { success: false, error: 'Bạn không có quyền hủy vé này' };
  }

  // Update trạng thái
  await prisma.queueTicket.update({
    where: { id: ticketId },
    data: { status: 'CANCELLED' },
  });

  revalidatePath('/queue');
  return { success: true };
}



/**
 * Lấy danh sách hàng đợi hiện tại
 */
export async function getCurrentQueue() {
  const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const today = new Date(todayVN);

  return await prisma.queueTicket.findMany({
    where: { 
      date: { gte: today }, 
      status: { notIn: ['CANCELLED', 'PAID', 'SKIPPED'] } 
    },
    include: {
      services: { // Lấy tên dịch vụ để hiển thị
        include: { service: true }
      },
      barber: true, // Lấy tên thợ
      user: {
        select: { fullName: true, avatarUrl: true }
      }
    },
    orderBy: { ticketNumber: 'asc' },
  });
}

/**
 * Ước tính thời gian chờ
 */
export async function estimateWaitTime() {
  // 1. Lấy số thợ đang đi làm (Active)
  const activeBarbersCount = await prisma.barber.count({ where: { isActive: true } });
  const divider = activeBarbersCount > 0 ? activeBarbersCount : 1;

  // 2. Lấy hàng đợi những người đang chờ hoặc đang làm
  const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const date = new Date(todayVN);
  
  const activeTickets = await prisma.queueTicket.findMany({
    where: {
      date: { gte: date },
      status: { in: ['WAITING', 'CALLING', 'SERVING', 'FINISHING'] }, 
      // Không tính PROCESSING (ngấm thuốc) vào load trực tiếp của thợ vì thợ đang rảnh
    },
    include: {
      services: { include: { service: true } }
    }
  });

  // 3. Tính tổng "Load" (Thời gian làm việc còn lại)
  let totalMinutesLoad = 0;
  
  for (const ticket of activeTickets) {
    // Tính tổng thời gian Work của vé này
    const ticketWorkLoad = ticket.services.reduce((acc, s) => acc + s.service.durationWork, 0);
    
    // Nếu đang làm dở, lẽ ra nên trừ đi thời gian đã làm, nhưng để đơn giản ta tính full
    // hoặc lấy trung bình. Ở đây cộng dồn hết.
    totalMinutesLoad += ticketWorkLoad;
  }

  // 4. Chia đều cho số thợ
  let estimatedWait = Math.ceil(totalMinutesLoad / divider);
  
  // Cộng thêm Buffer (dọn dẹp)
  estimatedWait += 5; 

  return { estimatedMinutes: estimatedWait };
}

/**
 * Lấy danh sách dịch vụ (Cho Form Booking)
 */
export async function getServices() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        discountPrice: true, // [MỚI] Lấy thêm trường này
        durationWork: true,
        durationWait: true,
      },
      orderBy: { price: 'asc' },
    });

    return services.map(s => ({
      id: s.id,
      name: s.name,
      price: s.price,
      discountPrice: s.discountPrice, // [MỚI]
      totalDuration: s.durationWork + s.durationWait 
    }));
  } catch (error) {
      console.error('Lỗi khi lấy danh sách dịch vụ:', error);
      return [];
  }
}

export async function getMyLatestTicket() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const date = new Date(todayVN);

    // 1. Tìm vé active mới nhất của user trong ngày
    const myTicket = await prisma.queueTicket.findFirst({
      where: {
        userId: user.id,
        date: { gte: date },
        status: { notIn: ['CANCELLED', 'PAID', 'SKIPPED'] } // Chỉ lấy vé còn hiệu lực
      },
      include: {
        services: {
          include: { service: true }
        }
      },
      orderBy: { ticketNumber: 'desc' }
    });

    if (!myTicket) {
      return { success: true, ticket: null };
    }

    // 2. Tính số người đang chờ trước mặt (Position)
    // Là những vé có cùng ngày, trạng thái WAITING/CALLING và số thứ tự nhỏ hơn
    const peopleAhead = await prisma.queueTicket.count({
      where: {
        date: { gte: date },
        status: { in: ['WAITING', 'CALLING'] },
        ticketNumber: { lt: myTicket.ticketNumber }
      }
    });

    // 3. Format dữ liệu trả về
    return {
      success: true,
      ticket: {
        ...myTicket,
        position: peopleAhead,
        // Map service để lấy mảng ID hoặc Tên tùy theo UI cần
        serviceIds: myTicket.services.map(s => s.serviceId),
        serviceNames: myTicket.services.map(s => s.service.name)
      }
    };

  } catch (error) {
    console.error("Get My Ticket Error:", error);
    return { success: false, error: 'Lỗi khi tải thông tin vé' };
  }
}
/**
 * ACTION TỔNG HỢP: Lấy toàn bộ dữ liệu cho trang Queue
 * Bao gồm: Queue List, Vé của User hiện tại, Thời gian chờ chung
 */
export async function fetchQueuePageData() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Lấy cấu hình ngày giờ
    const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const date = new Date(todayVN);

    // 2. Chạy song song các tác vụ
    const [queueList, activeBarbersCount, myTicket] = await Promise.all([
      // A. Lấy danh sách hàng đợi (Chỉ lấy vé chưa hoàn thành)
      prisma.queueTicket.findMany({
        where: { 
          date: { gte: date }, 
          status: { notIn: ['CANCELLED', 'PAID', 'SKIPPED', 'COMPLETED'] } 
        },
        include: {
          services: { include: { service: true } },
          barber: true,
          user: { select: { fullName: true, avatarUrl: true, phone: true } }
        },
        orderBy: { ticketNumber: 'asc' }, // Quan trọng: Sắp xếp để biết ai trước ai sau
      }),

      // B. Đếm thợ đang active
      prisma.barber.count({ where: { isActive: true } }),

      // C. Lấy vé của User hiện tại
      user ? prisma.queueTicket.findFirst({
        where: {
          userId: user.id,
          date: { gte: date },
          status: { notIn: ['CANCELLED', 'PAID', 'SKIPPED', 'COMPLETED'] }
        },
        include: { services: { include: { service: true } } }, // Cần services để tính thời gian cá nhân
        orderBy: { ticketNumber: 'desc' }
      }) : null
    ]);

    const safeBarberCount = activeBarbersCount > 0 ? activeBarbersCount : 1;

    // --- 3. TÍNH TOÁN 2 LOẠI THỜI GIAN ---

    //[cite_start]// CASE 1: Thời gian chờ chung (Cho người chưa lấy vé) [cite: 8, 11]
    // Tính toán dựa trên TOÀN BỘ hàng đợi hiện tại
    const generalWaitTime = calculateWaitTime(queueList, safeBarberCount);

    //[cite_start]// CASE 2: Thời gian chờ của riêng User (Nếu đã có vé) [cite: 1]
    let myWaitTime = 0;
    let myPosition = null;

    if (myTicket) {
      if (myTicket.status === 'SERVING' || myTicket.status === 'FINISHING') {
        // Đang cắt rồi thì chờ = 0
        myWaitTime = 0;
        myPosition = 0;
      } else {
        // Lọc ra danh sách những người đứng TRƯỚC mình (TicketNumber nhỏ hơn)
        // Bao gồm cả những người đang cắt (vì phải đợi họ xong thợ mới rảnh)
        const peopleAhead = queueList.filter(t => t.ticketNumber < myTicket.ticketNumber);
        
        myWaitTime = calculateWaitTime(peopleAhead, safeBarberCount);
        
        // Vị trí (chỉ tính những người đang WAITING trước mặt để hiển thị "Còn X người nữa")
        myPosition = queueList.filter(t => 
          ['WAITING', 'CALLING'].includes(t.status) && t.ticketNumber < myTicket.ticketNumber
        ).length;
      }
    }

    // 4. Trả về
    return {
      success: true,
      data: {
        queue: queueList,
        myTicket: myTicket ? { ...myTicket, position: myPosition } : null,
        
        // Trả về 2 giá trị riêng biệt
        estimatedWaitTime: generalWaitTime, // Dùng cho khách mới
        myWaitTime: myWaitTime,             // Dùng cho khách đã có vé
        
        currentUser: user ? { 
          name: user.user_metadata?.full_name || 'Bạn',
          phone: user.user_metadata?.phone || null,
          id: user.id,
          role: await getCurrentUserRole()
        } : null
      }
    };
    
  } catch (error) {
    console.error("Fetch Queue Data Error:", error);
    return { success: false, error: 'Lỗi tải dữ liệu hàng đợi' };
  }
}
// --- UPDATE 2: THÊM ACTION CHO NÚT "HOÀN THÀNH" ---
export async function completeTicketAction(ticketId: string, formData: FormData) { 
  try {
    // 1. Check quyền
    const role = await getCurrentUserRole();
    if (role !== 'BARBER' && role !== 'ADMIN') {
      throw new Error("Unauthorized: Bạn không phải thợ!");
    }

    // 2. Cập nhật vé (logic cũ giữ nguyên)
    const ticket = await prisma.queueTicket.update({
      where: { id: ticketId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      }
    });

    // 3. Giải phóng thợ và autoAssignTickets (logic cũ giữ nguyên)
    if (ticket.barberId) {
      await prisma.barber.update({
        where: { id: ticket.barberId },
        data: { isBusy: false }
      });
    }

    await autoAssignTickets();
    revalidatePath('/queue');
    return { success: true };
  } catch (error) {
    console.error("Complete Ticket Error:", error);
    // Lưu ý: Có thể trả về error message để hiển thị UI
    return { success: false, error: 'Lỗi khi hoàn thành vé' };
  }
}
/**
 * HÀM TỰ ĐỘNG PHÂN PHỐI KHÁCH (AUTO-ASSIGN)
 * Logic: Tìm thợ rảnh -> Tìm khách đợi lâu nhất -> Gán cặp
 */
async function autoAssignTickets() {
  try {
    const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const date = new Date(todayVN);

    await prisma.$transaction(async (tx) => {
      // 1. Tìm tất cả thợ đang đi làm (Active) và đang Rảnh (Not Busy)
      const freeBarbers = await tx.barber.findMany({
        where: { isActive: true, isBusy: false },
        orderBy: { name: 'asc' } // Hoặc logic xoay vòng nếu muốn
      });

      if (freeBarbers.length === 0) return; // Không có thợ rảnh thì thôi

      // 2. Lấy số lượng khách đang chờ (WAITING) tương ứng với số thợ rảnh
      const waitingTickets = await tx.queueTicket.findMany({
        where: { 
          date: { equals: date },
          status: 'WAITING'
        },
        orderBy: { ticketNumber: 'asc' },
        take: freeBarbers.length // Chỉ lấy đủ số lượng thợ rảnh
      });

      if (waitingTickets.length === 0) return;

      // 3. Ghép cặp Thợ - Khách
      for (let i = 0; i < waitingTickets.length; i++) {
        const ticket = waitingTickets[i];
        const barber = freeBarbers[i]; // Lấy thợ tương ứng

        // Cập nhật vé: Chuyển sang SERVING (hoặc CALLING tùy quy trình)
        await tx.queueTicket.update({
          where: { id: ticket.id },
          data: {
            status: 'SERVING', // Tự động chuyển sang đang cắt
            barberId: barber.id,
            actualStartTime: new Date(),
          }
        });

        // Cập nhật thợ: Bận
        await tx.barber.update({
          where: { id: barber.id },
          data: { isBusy: true }
        });
      }
    });
  } catch (error) {
    console.error("Auto Assign Error:", error);
  }
}

// --- MAIN ACTIONS ---

/**
 * Tạo vé xếp hàng mới
 */
export async function createQueueTicket(prevState: any, formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    if (!supabaseUser) return { success: false, error: 'Vui lòng đăng nhập để lấy số' };

    const dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      select: { id: true, fullName: true, phone: true },
    });

    if (!dbUser) return { success: false, error: 'Không tìm thấy thông tin người dùng.' };

    // --- [MỚI] KIỂM TRA CỬA HÀNG CÓ ĐÓNG CỬA KHÔNG ---
    const shopSettings = await prisma.shopSetting.findUnique({ where: { id: '1' } });
    
    // Nếu không tìm thấy setting hoặc isShopOpen = false
    if (shopSettings && !shopSettings.isShopOpen) {
        return { success: false, error: 'Cửa hàng hiện đang đóng cửa, vui lòng quay lại sau!' };
    }
    
    const servicesRaw = formData.get('services') as string;
    const serviceIds = JSON.parse(servicesRaw || '[]') as string[];

    if (!serviceIds.length) return { success: false, error: 'Vui lòng chọn ít nhất một dịch vụ' };

    const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }); 
    const date = new Date(todayVN);

    // await checkShopCapacity(date); // (Có thể bật lại nếu muốn giới hạn)

    const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } });
const totalPrice = services.reduce((sum, svc) => sum + getFinalPrice(svc), 0);
    const ticketNumber = await getNextTicketNumber(date);

    const result = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.queueTicket.create({
        data: {
          ticketNumber,
          date,
          status: 'WAITING',
          userId: dbUser.id,
          guestName: dbUser.fullName, 
          guestPhone: dbUser.phone,
          totalPrice: totalPrice,
          isPaid: false,
          joinedAt: new Date(),
          services: {
            create: services.map(svc => ({
              serviceId: svc.id,
             priceSnapshot: getFinalPrice(svc)
            }))
          }
        },
        include: { services: { include: { service: true } } }
      });
      return newTicket;
    });

    // ==> TỰ ĐỘNG GỌI: Nếu quán đang vắng (có thợ rảnh), khách này được vào luôn
    await autoAssignTickets();

    revalidatePath('/queue');
    return { success: true, ticket: result };

  } catch (error: any) {
  // 1. Log lỗi chi tiết ra server để dev debug
  console.error("[SERVER ERROR] Create Ticket in queue.action:", error);

  // 2. Kiểm tra nếu là lỗi logic do mình tự throw (Ví dụ: "Cửa hàng đóng cửa")
  // Bạn cần đảm bảo các lỗi logic tự throw không chứa thông tin nhạy cảm
  if (error.message === 'Cửa hàng hiện đang đóng cửa, vui lòng quay lại sau!' || 
      error.message === 'Vui lòng chọn ít nhất một dịch vụ') {
      return { success: false, error: error.message };
  }

  // 3. Với mọi lỗi khác (DB connection, Prisma error...), trả về thông báo chung
  return { success: false, error: 'Hệ thống đang bận, vui lòng thử lại sau.' };
}
}

/**
 * Cập nhật trạng thái vé (Admin/Thợ thao tác)
 * -> Kích hoạt Auto Assign khi thợ hoàn thành
 */
export async function updateTicketStatus(
  ticketId: string, 
  newStatus: TicketStatus, 
  barberId?: string
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const updateData: any = { status: newStatus };
  
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Logic Status
      if (newStatus === 'SERVING') {
        // Trường hợp này thường do thợ bấm thủ công đè lên auto
        updateData.actualStartTime = new Date();
        if (barberId) {
          updateData.barberId = barberId;
          await tx.barber.update({ where: { id: barberId }, data: { isBusy: true } });
        }
      } 
      // KHI HOÀN THÀNH / THANH TOÁN -> GIẢI PHÓNG THỢ
      else if (['COMPLETED', 'PAID', 'CANCELLED', 'SKIPPED'].includes(newStatus)) {
        if (newStatus === 'PAID') updateData.isPaid = true;
        if (newStatus === 'COMPLETED' || newStatus === 'PAID') updateData.completedAt = new Date();

        // Tìm thợ đang làm vé này để set rảnh
        const currentTicket = await tx.queueTicket.findUnique({ where: { id: ticketId } });
        if (currentTicket?.barberId) {
          await tx.barber.update({
            where: { id: currentTicket.barberId },
            data: { isBusy: false } // <== THỢ RẢNH TAY
          });
        }
      }
      // TRƯỜNG HỢP ASYNC (Ngấm thuốc) -> THỢ CŨNG RẢNH TẠM THỜI
      else if (newStatus === 'PROCESSING') {
         const currentTicket = await tx.queueTicket.findUnique({ where: { id: ticketId } });
         if (currentTicket?.barberId) {
           await tx.barber.update({
             where: { id: currentTicket.barberId },
             data: { isBusy: false }
           });
         }
      }

      // 2. Update Ticket
      await tx.queueTicket.update({
        where: { id: ticketId },
        data: updateData,
      });
    });

    // ==> QUAN TRỌNG: Sau khi thợ rảnh (do xong khách cũ), hệ thống tự gọi khách tiếp theo
    if (['COMPLETED', 'PAID', 'CANCELLED', 'SKIPPED', 'PROCESSING'].includes(newStatus)) {
        await autoAssignTickets();
    }

    revalidatePath('/admin/queue');
    revalidatePath('/queue'); // Update cả giao diện khách
    return { success: true };
  } catch (error: any) {
    console.error("Update Status Error:", error);
    return { success: false, error: 'Lỗi cập nhật trạng thái' };
  }
}
/**
 * Hàm kiểm tra nhanh trạng thái thanh toán của vé (Dùng cho Polling ở Client)
 */
export async function checkTicketPaymentStatus(ticketId: string) {
  try {
    const ticket = await prisma.queueTicket.findUnique({
      where: { id: ticketId },
      select: { 
        id: true, 
        isPaid: true, 
        status: true,
        totalPrice: true,
        amountPaid: true // [MỚI] Lấy thêm số tiền đã đóng
      }
    });
    
    if (!ticket) return { success: false, isPaid: false };

    // Tính số tiền còn thiếu
    const remaining = ticket.totalPrice - ticket.amountPaid;

    return { 
      success: true, 
      isPaid: ticket.isPaid, 
      status: ticket.status,
      amountPaid: ticket.amountPaid,
      remaining: remaining > 0 ? remaining : 0, // Trả về số tiền thiếu để UI hiển thị
      totalPrice: ticket.totalPrice
    };
  } catch (error) {
    return { success: false, isPaid: false };
  }
}
/**
 * [MỚI] Thợ/Admin hủy vé (Ví dụ: Khách vắng mặt, khách đổi ý)
 */
export async function cancelTicketByBarber(ticketId: string) {
  try {
    const role = await getCurrentUserRole();
    if (role !== 'BARBER' && role !== 'ADMIN') {
      return { success: false, error: 'Bạn không có quyền thực hiện thao tác này' };
    }

    // Cập nhật trạng thái vé
    const ticket = await prisma.queueTicket.update({
      where: { id: ticketId },
      data: {
        status: 'SKIPPED', // Hoặc 'CANCELLED' tùy logic nghiệp vụ (SKIPPED = Gọi không thấy)
        completedAt: new Date() // Đánh dấu thời điểm kết thúc
      }
    });

    // Giải phóng thợ nếu vé này đang được gán cho thợ đó
    if (ticket.barberId) {
      await prisma.barber.update({
        where: { id: ticket.barberId },
        data: { isBusy: false }
      });
    }

    // Gọi khách tiếp theo (Auto Assign)
    await autoAssignTickets();

    revalidatePath('/queue');
    return { success: true };
  } catch (error) {
    console.error("Cancel Ticket By Barber Error:", error);
    return { success: false, error: 'Lỗi khi hủy vé' };
  }
}
function getFinalPrice(service: any) {
  if (service.discountPrice && service.discountPrice < service.price) {
    return service.discountPrice;
  }
  return service.price;
}
// --- [LOGIC MỚI] HÀM TÍNH TOÁN THỜI GIAN CHỜ ---
/**
 * @param tickets Danh sách các vé cần tính toán
 * @param activeBarbersCount Số lượng thợ đang làm việc
 * @returns Số phút chờ dự kiến
 */
function calculateWaitTime(tickets: any[], activeBarbersCount: number) {
  if (activeBarbersCount === 0) return 0; // Không có thợ thì không tính (hoặc trả về số lớn tùy logic)
  
  let totalWorkLoad = 0;

  for (const ticket of tickets) {
    // Chỉ tính những vé đang CHỜ hoặc ĐANG CẮT
    // PROCESSING (Ngấm thuốc) -> Thợ rảnh tay -> Không tính vào load
    if (['WAITING', 'CALLING', 'SERVING', 'FINISHING'].includes(ticket.status)) {
       const ticketDuration = ticket.services.reduce((sum: number, s: any) => sum + s.service.durationWork, 0);
       totalWorkLoad += ticketDuration;
    }
  }

  // Chia đều công việc cho số thợ + 5 phút buffer dọn dẹp/di chuyển
  return Math.ceil(totalWorkLoad / activeBarbersCount) + 5;
}