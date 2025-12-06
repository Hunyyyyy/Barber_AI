// app/queue/page.tsx
'use client';

import { fetchQueuePageData } from '@/actions/queue.actions';
import CurrentQueueList from '@/components/queue/CurrentQueueList';
import QueueCard from '@/components/queue/QueueCard';
import ShopHeader from '@/components/queue/ShopHeader';
import { Loader2, Scissors, Sparkles } from 'lucide-react'; // Import thêm icon
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function QueueHomePage() {
  const [data, setData] = useState<{
    queue: any[];
    myTicket: any;
    estimatedWaitTime: number;
    currentUser: any;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const res = await fetchQueuePageData();
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); 
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
        <p className="text-gray-500 font-medium animate-pulse">Đang tải dữ liệu...</p>
      </div>
    );
  }

  const queue = data?.queue || [];
  const myTicket = data?.myTicket;
  const currentUser = data?.currentUser;
  console.log('QueueHomePage - currentUser:', currentUser);
  const estimatedTime = data?.estimatedWaitTime || 15;

  const hasTicket = !!myTicket;
  const userName = currentUser?.name || 'Khách';
  const userRole = currentUser?.role || null;
  const waitingCount = queue.filter(q => ['WAITING', 'ASYNC_WAIT', 'CALLING'].includes(q.status)).length;

  // Logic check status đang làm
  const isServing = hasTicket && ['SERVING', 'PROCESSING', 'FINISHING'].includes(myTicket.status);
  const isProcessing = hasTicket && myTicket.status === 'PROCESSING';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full mx-auto px-0 sm:px-0 lg:px-0 py-0">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
            <div className="w-full mx-auto px-6 py-6">
              <ShopHeader hasTicket={hasTicket} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 p-8 lg:p-12">
            
            {/* Cột trái */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-black text-gray-900">
                  Xin chào, {userName}!
                </h1>
                <p className="text-gray-600 mt-2">Hôm nay bạn muốn làm gì nào?</p>
              </div>

              <div className="scale-110 origin-top-left">
                <QueueCard waitingCount={waitingCount} estimatedWaitTime={estimatedTime} />
              </div>

              {/* LOGIC NÚT / THẺ VÉ */}
              {!hasTicket ? (
                // [MỚI] Kiểm tra quyền: Nếu là ADMIN hoặc BARBER thì vô hiệu hóa
                (userRole === 'ADMIN' || userRole === 'BARBER') ? (
                  <button 
                    disabled
                    className="w-full bg-gray-200 text-gray-400 py-6 rounded-2xl font-bold text-xl cursor-not-allowed flex items-center justify-center gap-4 border border-gray-300"
                  >
                    <span>BẠN LÀ QUẢN TRỊ VIÊN/THỢ</span>
                    <Scissors className="w-6 h-6 opacity-50" />
                  </button>
                ) : (
                  // Nút Lấy số bình thường cho khách (USER)
                  <Link href="/queue/select-service">
                    <button className="cursor-pointer w-full bg-black text-white py-6 rounded-2xl font-bold text-xl shadow-2xl hover:bg-gray-900 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-4 group">
                      <span>LẤY SỐ NGAY</span>
                      <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </Link>
                )
              ) : (
                <Link href="/queue/my-ticket">
                  {/* ... (Giữ nguyên phần hiển thị vé đã có) ... */}
                  <div className={`
                    border-2 p-8 rounded-2xl cursor-pointer hover:shadow-2xl transition-all group text-center relative overflow-hidden
                    ${isServing 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
                      : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                    }
                  `}>
                    {/* ... Nội dung bên trong thẻ vé giữ nguyên ... */}
                    <div className={`
                        absolute top-0 right-0 text-xs font-bold px-3 py-1 rounded-bl-xl
                        ${isServing ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}
                      `}>
                        {isServing ? 'ĐANG THỰC HIỆN' : 'ĐANG XẾP HÀNG'}
                      </div>

                      <p className={`${isServing ? 'text-blue-800' : 'text-green-800'} font-bold text-2xl`}>
                        Vé của bạn
                      </p>
                      <p className={`${isServing ? 'text-blue-700' : 'text-green-700'} text-7xl font-black mt-4 tracking-tighter`}>
                        #{myTicket.ticketNumber?.toString().padStart(2, '0')}
                      </p>
                      
                      {isServing ? (
                        <div className="mt-3 flex flex-col items-center justify-center text-blue-600 animate-pulse">
                          {isProcessing ? (
                            <>
                                <Sparkles className="w-6 h-6 mb-1"/>
                                <span className="font-bold text-lg">Đang ngấm thuốc</span>
                            </>
                          ) : (
                            <>
                                <Scissors className="w-6 h-6 mb-1"/>
                                <span className="font-bold text-lg">Đang cắt tóc</span>
                            </>
                          )}
                        </div>
                      ) : (
                        myTicket.position > 0 ? (
                          <p className="text-green-600 text-lg mt-3">
                            Còn <span className="font-black text-xl">{myTicket.position}</span> người nữa
                          </p>
                        ) : (
                          <p className="text-green-600 text-lg mt-3 font-bold animate-pulse">
                            Sắp đến lượt bạn rồi!
                          </p>
                        )
                      )}

                      <div className={`mt-6 flex items-center justify-center gap-2 font-medium ${isServing ? 'text-blue-700' : 'text-green-700'}`}>
                        Xem chi tiết
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                  </div>
                </Link>
              )}
            </div>

            {/* Cột phải: Danh sách hàng đợi */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Hàng đợi hiện tại</h2>
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Live Update</span>
                  </div>
                </div>

                <CurrentQueueList 
                   queue={queue} 
                   highlightTicketId={myTicket?.id} 
                   currentUserRole={userRole}
                />

                {queue.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-bold text-gray-900">Tiệm đang trống!</p>
                    <p className="text-gray-500">Cơ hội tuyệt vời để cắt tóc ngay mà không cần đợi.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}