// app/queue/my-ticket/page.tsx
'use client';

import { cancelQueueTicket, getMyLatestTicket } from '@/actions/queue.actions';
import QueueTicket from '@/components/queue/QueueTicket';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Scissors, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const AVG_SERVICE_MINUTES = 25; // Thời gian ước tính mỗi khách

export default function MyTicketPage() {
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Hàm fetch dữ liệu
  const fetchTicket = async () => {
    try {
      const res = await getMyLatestTicket();
      if (res.success) {
        setTicket(res.ticket);
        // Tùy chọn: Nếu không có vé active thì redirect hoặc giữ nguyên hiển thị empty state
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Fetch ngay khi load và Polling mỗi 10s
  useEffect(() => {
    fetchTicket();
    const interval = setInterval(fetchTicket, 10000); 
    return () => clearInterval(interval);
  }, []);

  // --- Logic xử lý Hủy vé ---
  const handleCancel = async () => {
    if (!ticket) return;
    const confirmCancel = confirm(`Bạn có chắc chắn muốn hủy số thứ tự #${ticket.ticketNumber} không?`);
    
    if (confirmCancel) {
      setCancelling(true);
      try {
        const res = await cancelQueueTicket(ticket.id);
        if (res.success) {
          router.push('/queue'); 
        } else {
          alert(res.error || 'Lỗi khi hủy vé');
        }
      } catch (err) {
        alert('Có lỗi xảy ra');
      } finally {
        setCancelling(false);
      }
    }
  };

  // --- Render Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- Render khi không có vé ---
  if (!ticket) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
            <p className="text-xl text-gray-600">Bạn hiện không có vé nào đang chờ.</p>
            <Link href="/queue" className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:scale-105 transition-transform">
                Lấy số ngay
            </Link>
        </div>
     );
  }

  // --- Chuẩn bị dữ liệu hiển thị ---
  const currentPosition = ticket.position ?? 0;
  const status = ticket.status;
  
  // Logic kiểm tra nhóm trạng thái
  const isServing = ['SERVING', 'FINISHING', 'IN_PROGRESS'].includes(status);
  const isProcessing = status === 'PROCESSING'; // Ngấm thuốc
  const isCalling = status === 'CALLING';
  const isWaiting = status === 'WAITING';

  // Tính thời gian chờ (Chỉ hiển thị con số khi đang đợi)
  const estimatedWaitMinutes = currentPosition > 0 ? currentPosition * AVG_SERVICE_MINUTES + 5 : 5;
  
  let estimatedTimeMessage = `Khoảng ${estimatedWaitMinutes} phút`;
  if (isServing || isProcessing) estimatedTimeMessage = 'Đang thực hiện';
  else if (isCalling) estimatedTimeMessage = 'Vui lòng đến quầy';

  // Cấu hình Thông báo trạng thái & Màu sắc
  let StatusIcon = AlertCircle;
  let statusMessage = 'Đang chờ đến lượt của bạn.';
  let statusColorClass = 'bg-indigo-50/50 text-indigo-800 border-indigo-200 border';

  if (isServing) {
    StatusIcon = Scissors;
    statusMessage = 'THỢ ĐANG THỰC HIỆN DỊCH VỤ!';
    statusColorClass = 'bg-blue-600 text-white shadow-lg shadow-blue-200';
  } else if (isProcessing) {
    StatusIcon = Sparkles;
    statusMessage = 'ĐANG NGẤM THUỐC / CHỜ XỬ LÝ';
    statusColorClass = 'bg-purple-600 text-white shadow-lg shadow-purple-200';
  } else if (isCalling) {
    StatusIcon = AlertCircle;
    statusMessage = 'ĐANG GỌI! Vui lòng đến ngay quầy.';
    statusColorClass = 'bg-yellow-500 text-white shadow-lg shadow-yellow-200 animate-pulse';
  } else if (status === 'FINISHING') {
    StatusIcon = CheckCircle2;
    statusMessage = 'ĐANG HOÀN THIỆN / SẤY TÓC';
    statusColorClass = 'bg-teal-600 text-white shadow-lg shadow-teal-200';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
            <div className="px-6 py-6 flex justify-between items-center">
              <Link href="/queue" className="flex items-center gap-2 text-gray-600 hover:text-black transition">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold text-sm hidden sm:inline">Quay lại hàng đợi</span>
              </Link>
              
              {/* Chỉ hiện nút Hủy khi đang đợi hoặc đang gọi (chưa làm) */}
              {(isWaiting || isCalling) && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-red-500 hover:text-red-700 font-medium text-sm transition disabled:opacity-50"
                >
                  {cancelling ? 'Đang hủy...' : 'Hủy số thứ tự'}
                </button>
              )}
            </div>
          </div>

          {/* Nội dung chính */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 p-8 lg:p-12">
            
            {/* Cột trái: Thông tin & Vé */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* Alert Status Banner */}
              <div className={`p-6 rounded-2xl transition-all duration-500 flex items-center gap-4 ${statusColorClass}`}>
                <StatusIcon className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold leading-tight uppercase">{statusMessage}</h2>
                  {isWaiting && (
                    <p className="text-sm opacity-90 mt-1">
                      Còn <strong className="text-lg">{currentPosition}</strong> người nữa là đến bạn.
                    </p>
                  )}
                  {isServing && <p className="text-sm opacity-90 mt-1">Hãy thư giãn và tận hưởng dịch vụ.</p>}
                </div>
              </div>

              {/* Component Vé */}
              <div className="scale-105 origin-top">
                <QueueTicket 
                  queueNumber={ticket.ticketNumber}
                  customerName={ticket.guestName || ticket.customerName || 'Bạn'}
                  // Truyền serviceNames để hiển thị tên đẹp (vì serviceIds có thể là UUID)
                  services={ticket.serviceNames || ticket.serviceIds || []} 
                  estimatedTime={estimatedTimeMessage}
                  position={currentPosition}
                  status={status}
                  onCancel={handleCancel}
                />
              </div>

              {/* Thông tin phụ (Chỉ hiện khi đang đợi) */}
              {isWaiting && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                   <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                      <Clock className="w-6 h-6 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Thời gian ước tính</p>
                        <p className="text-sm text-gray-500">{estimatedTimeMessage}</p>
                      </div>
                    </div>
                </div>
              )}
            </div>

            {/* Cột phải: Hướng dẫn */}
            <div className="lg:col-span-1 space-y-10">
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg">
                  <h3 className="font-bold text-2xl mb-5 text-gray-900">Hướng dẫn</h3>
                  <ol className="space-y-5 text-gray-700">
                    <li className="flex items-start gap-4">
                      <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                      <span>Theo dõi số thứ tự trên màn hình này.</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="w-8 h-8 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center font-bold text-sm">2</span>
                      <span>Đến cửa hàng trước 5-10 phút khi gần đến lượt.</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-sm">3</span>
                      <span>Đưa mã QR cho nhân viên khi được gọi.</span>
                    </li>
                  </ol>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}