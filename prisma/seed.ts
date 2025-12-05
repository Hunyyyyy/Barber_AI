import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  // ===========================================================
  // 1. Tạo ShopSetting (Cấu hình quán)
  // ===========================================================
  await prisma.shopSetting.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      maxDailyTickets: 80,
      isShopOpen: true,
      morningOpen: '08:00',
      morningClose: '11:30',
      afternoonOpen: '13:30',
      afternoonClose: '19:00',
    },
  });

  console.log('✅ ShopSetting: Đã cấu hình xong.');

  // ===========================================================
  // 2. Tạo danh sách Dịch vụ (Service)
  // ===========================================================
  const services = [
    {
      id: 'CUT',
      name: 'Cắt tóc nam',
      description: 'Cắt + gội + sấy tạo kiểu cơ bản',
      price: 100000,
      durationWork: 30,
      durationWait: 0,
    },
    {
      id: 'WASH',
      name: 'Gội đầu massage',
      description: 'Gội dưỡng + massage đầu vai cổ 20 phút',
      price: 80000,
      durationWork: 20,
      durationWait: 0,
    },
    {
      id: 'SHAVE',
      name: 'Cạo mặt + ráy tai',
      description: 'Cạo sạch, ráy tai chuyên sâu, dưỡng da',
      price: 50000,
      durationWork: 15,
      durationWait: 0,
    },
    {
      id: 'PERM',
      name: 'Uốn tóc',
      description: 'Uốn lạnh/nhiệt, tạo kiểu tự nhiên',
      price: 350000,
      durationWork: 20,
      durationWait: 45,
    },
    {
      id: 'DYE',
      name: 'Nhuộm tóc',
      description: 'Nhuộm phủ bạc hoặc đổi màu thời thượng',
      price: 300000,
      durationWork: 25,
      durationWait: 60,
    },
    {
      id: 'STYLE',
      name: 'Tạo kiểu (Sáp/Gôm)',
      description: 'Vuốt sáp, tạo kiểu đẹp đi chơi',
      price: 60000,
      durationWork: 15,
      durationWait: 0,
    },
    {
      id: 'COMBO_FULL',
      name: 'Combo Đế Vương',
      description: 'Cắt + Uốn/Nhuộm + Gội + Massage + Ráy tai',
      price: 500000,
      durationWork: 60,
      durationWait: 45,
    },
  ];

  for (const svc of services) {
    // Loại bỏ trường description trước khi create vì schema không có
    const { description, ...serviceData } = svc;
    
    await prisma.service.upsert({
      where: { id: svc.id },
      update: {
        price: svc.price,
        durationWork: svc.durationWork,
        durationWait: svc.durationWait,
      },
      create: serviceData, 
    });
  }

  console.log(`✅ Services: Đã tạo/cập nhật ${services.length} dịch vụ.`);

  // ===========================================================
  // 3. Tạo Thợ (Barber) - Kèm User
  // ===========================================================
  // [QUAN TRỌNG] Password giả định (đã hash của '123456')
  const DUMMY_PASSWORD_HASH = '$2b$10$EpRnTzVlqHNP0.fKbXTnLOsyJL.XFzI4W.aX9.qX9.qX9.qX9.qX9'; 

  const barbersData = [
    { id: 'barber-tuan', name: 'Anh Tuấn', phone: '0988888881', isActive: true },
    { id: 'barber-hung', name: 'Em Hùng', phone: '0988888882', isActive: true },
    { id: 'barber-linh', name: 'Chị Linh', phone: '0988888883', isActive: true },
    { id: 'barber-kien', name: 'Anh Kiên', phone: '0988888884', isActive: false },
  ];

  for (const b of barbersData) {
    // BƯỚC 1: Tạo User cho thợ trước
    const user = await prisma.user.upsert({
        where: { phone: b.phone }, // Dùng SĐT làm unique key
        update: {
            fullName: b.name,
            role: Role.BARBER, // Đảm bảo role đúng
        },
        create: {
            phone: b.phone,
            fullName: b.name,
            passwordHash: DUMMY_PASSWORD_HASH,
            role: Role.BARBER,
            email: `${b.id}@barber.local`, // Email giả
        }
    });

    // BƯỚC 2: Tạo Barber và LINK với User vừa tạo
    await prisma.barber.upsert({
      where: { id: b.id },
      update: { 
          isActive: b.isActive,
          // userId: user.id // Thường không update userId, nhưng có thể thêm nếu cần
      },
      create: {
        id: b.id,
        name: b.name,
        isActive: b.isActive,
        isBusy: false,
        userId: user.id, // [QUAN TRỌNG] Phải có dòng này để fix lỗi
      },
    });
  }

  console.log(`✅ Barbers: Đã tạo ${barbersData.length} thợ (kèm tài khoản User tương ứng).`);

  // ===========================================================
  // 4. Tạo User mẫu khác (Admin & Khách)
  // ===========================================================
  const otherUsers = [
    {
      email: 'admin@barber.com',
      phone: '0909000111',
      fullName: 'Quản Trị Viên',
      role: Role.ADMIN,
      passwordHash: DUMMY_PASSWORD_HASH,
    },
    {
      email: 'khach@gmail.com',
      phone: '0912345678',
      fullName: 'Nguyễn Văn Khách',
      role: Role.USER,
      passwordHash: DUMMY_PASSWORD_HASH,
    }
  ];

  for (const user of otherUsers) {
    await prisma.user.upsert({
      where: { phone: user.phone },
      update: {},
      create: user,
    });
  }

  console.log(`✅ Users: Đã tạo thêm ${otherUsers.length} tài khoản mẫu (Admin/Khách).`);
  console.log('🚀 Seed dữ liệu hoàn tất!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });