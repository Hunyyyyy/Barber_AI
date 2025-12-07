'use client';

// Thêm dòng này để fix lỗi cache cookie nếu cần thiết, dù ở client side ít ảnh hưởng hơn
export const dynamic = 'force-dynamic';

import { getHomePageData } from '@/actions/home.actions';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, CalendarDays, Clock, Loader2, MapPin, Megaphone, Phone, Scissors, Star, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  // 1. Khai báo State để chứa dữ liệu và trạng thái loading
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
const [showAnnouncement, setShowAnnouncement] = useState(true);
  // 2. Dùng useEffect để gọi dữ liệu khi component vừa mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await getHomePageData();
        setData(res);
      } catch (error) {
        console.error("Lỗi tải trang chủ:", error);
      } finally {
        setLoading(false); // Tắt loading dù thành công hay thất bại
      }
    };

    loadData();
  }, []);

  // 3. Màn hình Loading (Hiển thị ngay lập tức khi vào trang)
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
        <p className="text-muted-foreground font-medium animate-pulse">Đang tải trải nghiệm...</p>
      </div>
    );
  }

  // 4. Xử lý trường hợp không có dữ liệu (Lỗi server)
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Không thể tải dữ liệu</h2>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-black text-white rounded-lg">Thử lại</button>
        </div>
      </div>
    );
  }

  // 5. Destructuring dữ liệu (Giống code cũ)
  const { shopName, address, settings, services, barbers, owner } = data;
  const isOpen = settings?.isShopOpen;
const hasAnnouncement = settings?.isAnnouncementShow && settings?.announcementText && showAnnouncement;
  // 6. Render giao diện chính
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 animate-in fade-in duration-500">
      {/* --- [MỚI] NOTIFICATION BAR --- */}
      {hasAnnouncement && (
        <div className="relative bg-yellow-400 text-black px-4 py-3 text-center font-medium text-sm md:text-base z-50 shadow-md">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
                <Megaphone className="w-5 h-5 animate-bounce" />
                <span className="font-bold uppercase tracking-wide mr-1">THÔNG BÁO:</span>
                <span>{settings.announcementText}</span>
            </div>
            <button 
                onClick={() => setShowAnnouncement(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-black/10 rounded-full transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
      )}
      {/* --- HERO SECTION --- */}
      <div className="relative bg-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32 flex flex-col items-center text-center">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <span className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="font-bold text-sm tracking-wide">
              {isOpen ? 'ĐANG MỞ CỬA - SẴN SÀNG PHỤC VỤ' : 'HIỆN ĐANG ĐÓNG CỬA'}
            </span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black mb-6 tracking-tighter shadow-black drop-shadow-lg uppercase">
            {shopName}
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mb-10 drop-shadow-md">
            Trải nghiệm cắt tóc đẳng cấp với đội ngũ Stylist chuyên nghiệp và công nghệ đặt lịch thông minh.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/queue">
              <button className="cursor-pointer w-full sm:w-auto px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Lấy Số Ngay
              </button>
            </Link>
            <Link href="#services">
              <button className="cursor-pointer w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
                Xem Bảng Giá
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-20">
        
        {/* --- INFO CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-20 relative z-10">
          
          {/* Giờ mở cửa */}
          <div className="bg-white text-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-2">Giờ Hoạt Động</h3>
            <div className="space-y-1 text-gray-500">
              <p className="flex justify-between">
                <span>Sáng:</span> <span className="font-semibold text-gray-900">{settings?.morningOpen} - {settings?.morningClose}</span>
              </p>
              <p className="flex justify-between">
                <span>Chiều:</span> <span className="font-semibold text-gray-900">{settings?.afternoonOpen} - {settings?.afternoonClose}</span>
              </p>
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="bg-white text-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-2">Địa Chỉ & Liên Hệ</h3>
            <p className="text-gray-500 mb-2">{address}</p>
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <Phone className="w-4 h-4" />
              <a href={`tel:${owner?.phone}`} className="hover:underline">{owner?.phone}</a>
            </div>
            <p className="text-sm text-gray-400 mt-1">Chủ quán: {owner?.fullName}</p>
          </div>

          {/* Thợ ưu tú */}
          <div className="bg-black text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between border border-gray-800">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-bold tracking-widest text-sm opacity-80 uppercase">Top Stylist</span>
              </div>
              <h3 className="font-bold text-2xl">Đội ngũ chuyên nghiệp</h3>
              <p className="opacity-80 mt-2 text-sm">
                Những đôi tay vàng sẵn sàng tạo kiểu cho bạn.
              </p>
            </div>
            <div className="flex -space-x-4 mt-6">
              {barbers?.slice(0, 4).map((barber: any, idx: number) => (
                <div key={barber.id || idx} className="w-12 h-12 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center font-bold text-xs overflow-hidden" title={barber.name}>
                   {barber.name?.[0]}
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-2 border-black bg-white text-black flex items-center justify-center font-bold text-xs">
                +{barbers?.length > 4 ? barbers.length - 4 : 0}
              </div>
            </div>
          </div>
        </div>

        {/* --- DỊCH VỤ --- */}
        <section id="services">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black mb-4 text-gray-900">Bảng Giá Dịch Vụ</h2>
            <p className="text-gray-500">Cam kết giá minh bạch, không phát sinh chi phí</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services?.map((service: any) => (
              <div key={service.id} className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-black hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-gray-100 text-gray-500 group-hover:bg-black group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <span className="font-black text-xl text-gray-900">{formatCurrency(service.price)}</span>
                </div>
                <h3 className="font-bold text-xl mb-2 text-gray-900">{service.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {service.durationWork} phút
                  </span>
                  {service.durationWait > 0 && (
                    <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded">
                      + {service.durationWait}p chờ
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- ĐỘI NGŨ THỢ --- */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-gray-900">Barber Team</h2>
            <Link href="/queue" className="hidden sm:flex items-center gap-2 font-bold hover:underline text-black">
              Xem trạng thái hàng đợi <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {barbers?.map((barber: any) => (
              <div key={barber.id} className="bg-white p-4 rounded-2xl text-center border border-gray-100 hover:shadow-lg transition-all">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full mb-4 flex items-center justify-center text-3xl font-black text-gray-400 overflow-hidden relative">
                   {barber.avatarUrl ? (
                       <img src={barber.avatarUrl} alt={barber.name} className="w-full h-full object-cover"/>
                   ) : (
                       <span>{barber.name?.[0]}</span>
                   )}
                   {/* Online status dot */}
                   <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${barber.isBusy ? 'bg-red-500' : 'bg-green-500'}`}></div>
                </div>
                <h3 className="font-bold text-lg text-gray-900">{barber.name}</h3>
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mt-2 ${
                  barber.isBusy 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  {barber.isBusy ? 'Đang bận' : 'Đang rảnh'}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-black mb-4">{shopName}</h2>
          <p className="text-gray-400 mb-8">{address}</p>
          <p className="text-sm text-gray-600">
            © 2024 {shopName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}