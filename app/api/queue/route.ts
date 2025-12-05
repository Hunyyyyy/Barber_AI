// // app/api/queue/route.ts
// import { prisma } from '@/lib/supabase/prisma/db';
// import { createSupabaseServerClient } from '@/lib/supabase/server';
// import { NextResponse } from 'next/server';

// // GET: Get current queue (with optional date param)
// export async function GET(request: Request) {
//   const supabase = await createSupabaseServerClient();
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//   const { searchParams } = new URL(request.url);
//   const dateStr = searchParams.get('date');

//   let date;
//   if (dateStr) {
//     // Nếu client gửi lên, dùng luôn ngày đó (client gửi YYYY-MM-DD)
//     date = new Date(dateStr); 
//   } else {
//     // Nếu không gửi, lấy ngày hiện tại theo giờ VN
//     const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
//     date = new Date(todayVN);
//   }

//   const queue = await prisma.queueTicket.findMany({
//     where: { date: { gte: date }, status: { notIn: ['CANCELLED', 'PAID'] } },
//     orderBy: { queueNumber: 'asc' },
//   });

//   return NextResponse.json(queue);
// }

// // POST: Create ticket (API alternative to action)
// export async function POST(request: Request) {
//   const supabase = await createSupabaseServerClient();
//   // Đổi tên 'user' thành 'supabaseUser' để phân biệt với Model User của Prisma
//   const { data: { user: supabaseUser } } = await supabase.auth.getUser(); 
//   if (!supabaseUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//   try {
//     const body = await request.json();
//     const { customerName, phone, services } = body;

//     // BƯỚC SỬA LỖI: Truy vấn Prisma để lấy name và phone từ DB
//     const dbUser = await prisma.user.findUnique({
//       where: { id: supabaseUser.id },
//       select: { name: true, phone: true },
//     });

//     if (!dbUser) {
//         // Xử lý trường hợp người dùng đăng nhập Auth nhưng không có trong bảng User
//         return NextResponse.json({ error: 'User data not found in database' }, { status: 404 });
//     }

//     const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
//     const date = new Date(todayVN);
//     // Reuse logic from actions (in real, extract to shared util)
//     const settings = await prisma.shopSetting.findUnique({ where: { id: '1' } });
//     if (!settings) return NextResponse.json({ error: 'Shop settings not found' }, { status: 500 });

//     const dailyCount = await prisma.queueTicket.count({
//       where: { date: { equals: date }, status: { notIn: ['CANCELLED', 'PAID'] } },
//     });
//     if (dailyCount >= settings.maxDailyCapacity) {
//       return NextResponse.json({ error: 'Reached maximum daily capacity' }, { status: 400 });
//     }

//     const concurrentCount = await prisma.queueTicket.count({
//       where: { date: { equals: date }, status: { in: ['CALLING', 'IN_PROGRESS', 'ASYNC_WAIT'] } },
//     });
//     if (concurrentCount >= settings.maxConcurrent) {
//       return NextResponse.json({ error: 'Shop is at maximum capacity' }, { status: 400 });
//     }

//     const estimatedDuration = services.reduce((total: number, svc: string) => total + ((settings.durations as any)[svc] || 0), 0);

//     const lastTicket = await prisma.queueTicket.findFirst({
//       where: { date: { equals: date } },
//       orderBy: { queueNumber: 'desc' },
//     });
//     const queueNumber = (lastTicket?.queueNumber || 0) + 1;

//     const ticket = await prisma.queueTicket.create({
//       data: {
//         queueNumber,
//         date,
//         status: 'WAITING',
//         // SỬA LỖI: Thay user.name/phone bằng dbUser.name/phone
//         customerName: customerName || dbUser.name || 'Khách', 
//         phone: phone || dbUser.phone || '',
//         services: services as any,
//         estimatedDuration,
//         joinedAt: new Date(),
//       },
//     });

//     await prisma.appointment.create({
//       data: {
//         queueNumber,
//         date,
//         status: 'PENDING',
//         userId: supabaseUser.id, // Vẫn dùng ID từ Supabase Auth User
//         items: {
//           create: services.map((svc: string) => ({
//             serviceId: svc,
//           })),
//         },
//       },
//     });

//     return NextResponse.json({ success: true, ticket });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }
// }

// // PUT: Update status (e.g., for admin API calls)
// export async function PUT(request: Request) {
//   const supabase = await createSupabaseServerClient();
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user || (user.role !== 'ADMIN' && user.role !== 'BARBER')) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   try {
//     const body = await request.json();
//     const { ticketId, newStatus, barberId } = body;

//     const data: any = { status: newStatus };
//     if (newStatus === 'IN_PROGRESS') {
//       data.startedAt = new Date();
//       if (barberId) {
//         data.assignedBarberId = barberId;
//         await prisma.barber.update({ where: { id: barberId }, data: { currentTicketId: ticketId } });
//       }
//     } else if (newStatus === 'COMPLETED') {
//       data.completedAt = new Date();
//       await prisma.barber.updateMany({ where: { currentTicketId: ticketId }, data: { currentTicketId: null } });
//     } else if (newStatus === 'PAID') {
//       data.paidAt = new Date();
//       const ticket = await prisma.queueTicket.findUnique({ where: { id: ticketId } });
//       if (ticket) {
//         await prisma.appointment.updateMany({
//           where: { date: ticket.date, queueNumber: ticket.queueNumber },
//           data: { status: 'COMPLETED', isPaid: true },
//         });
//       }
//     } else if (newStatus === 'ASYNC_WAIT') {
//       await prisma.barber.updateMany({ where: { currentTicketId: ticketId }, data: { currentTicketId: null } });
//     }

//     await prisma.queueTicket.update({
//       where: { id: ticketId },
//       data,
//     });

//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }
// }

// // DELETE: Cancel ticket
// export async function DELETE(request: Request) {
//   const supabase = await createSupabaseServerClient();
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//   try {
//     const { searchParams } = new URL(request.url);
//     const ticketId = searchParams.get('ticketId');

//     if (!ticketId) return NextResponse.json({ error: 'Missing ticketId' }, { status: 400 });

//     const ticket = await prisma.queueTicket.findUnique({ where: { id: ticketId } });
//     if (!ticket || (ticket.phone !== user.phone && user.role !== 'ADMIN')) {
//       return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
//     }

//     await prisma.queueTicket.update({
//       where: { id: ticketId },
//       data: { status: 'CANCELLED', cancelledAt: new Date() },
//     });

//     await prisma.appointment.updateMany({
//       where: { date: ticket.date, queueNumber: ticket.queueNumber },
//       data: { status: 'CANCELLED' },
//     });

//     return NextResponse.json({ success: true });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }
// }