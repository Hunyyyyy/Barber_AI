import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  // ===========================================================
  // 1. Tạo ShopSetting (Cấu hình quán)
  // ===========================================================
  await prisma.shopSetting.upsert({
    where: { id: '1' },
    update: {}, // Nếu tồn tại thì không làm gì (giữ nguyên cấu hình cũ)
    create: {
      id: '1',
      maxDailyTickets: 80, // Giới hạn số khách/ngày
      isShopOpen: true,    // Mặc định mở cửa
      
      // Giờ mở cửa theo schema mới
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
      durationWork: 30, // Thợ làm: 30p
      durationWait: 0,  // Chờ: 0p
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
      durationWork: 20, // Thời gian cuốn lô/bôi thuốc
      durationWait: 45, // Thời gian ngồi chờ ngấm thuốc (Async)
    },
    {
      id: 'DYE',
      name: 'Nhuộm tóc',
      description: 'Nhuộm phủ bạc hoặc đổi màu thời thượng',
      price: 300000,
      durationWork: 25,
      durationWait: 60, // Thời gian chờ lên màu
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
    // Tách description ra vì schema hiện tại của bạn không có trường description
    // Nếu bạn đã thêm trường description vào schema thì bỏ dòng destructuring này đi
    const { description, ...serviceData } = svc;
    
    await prisma.service.upsert({
      where: { id: svc.id },
      update: {
        // Cập nhật giá và thời gian nếu chạy seed lại
        price: svc.price,
        durationWork: svc.durationWork,
        durationWait: svc.durationWait,
      },
      create: serviceData, // Lưu ý: Nếu schema chưa có description, nó sẽ bị báo lỗi nếu truyền vào
    });
  }

  console.log(`✅ Services: Đã tạo/cập nhật ${services.length} dịch vụ.`);

  // ===========================================================
  // 3. Tạo danh sách Thợ (Barber)
  // ===========================================================
  const barbers = [
    { id: 'barber-tuan', name: 'Anh Tuấn (Chủ tiệm)', isActive: true },
    { id: 'barber-hung', name: 'Em Hùng', isActive: true },
    { id: 'barber-linh', name: 'Chị Linh', isActive: true },
    { id: 'barber-kien', name: 'Anh Kiên', isActive: false }, // Đang nghỉ
  ];

  for (const barber of barbers) {
    await prisma.barber.upsert({
      where: { id: barber.id },
      update: { isActive: barber.isActive },
      create: {
        id: barber.id,
        name: barber.name,
        isActive: barber.isActive,
        isBusy: false, // Mặc định là rảnh
      },
    });
  }

  console.log(`✅ Barbers: Đã thêm ${barbers.length} thợ.`);

  // ===========================================================
  // 4. Tạo User mẫu (Admin & Khách hàng)
  // ===========================================================
  // Lưu ý: PasswordHash ở đây là giả định. Trong thực tế bạn cần dùng bcrypt để hash.
  // Ví dụ hash của "123456"
  const DUMMY_PASSWORD_HASH = '$2b$10$EpRnTzVlqHNP0.fKbXTnLOsyJL.XFzI4W.aX9.qX9.qX9.qX9.qX9'; 

  const users = [
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

  for (const user of users) {
    await prisma.user.upsert({
      where: { phone: user.phone }, // Dùng SĐT làm key check
      update: {},
      create: user,
    });
  }

  console.log(`✅ Users: Đã tạo ${users.length} tài khoản mẫu (Pass: 123456).`);

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