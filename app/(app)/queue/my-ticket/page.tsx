// app/queue/my-ticket/page.tsx
'use client';

import { cancelQueueTicket, getMyLatestTicket } from '@/actions/queue.actions';
import PaymentModal from '@/components/queue/PaymentModal';
import QueueTicket from '@/components/queue/QueueTicket';
import {
  AlertCircle, ArrowLeft, CheckCircle2, Clock,
  CreditCard, Info, MapPin, Phone, Scissors, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const AVG_SERVICE_MINUTES = 25; 

export default function MyTicketPage() {
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // ... (Giữ nguyên logic fetchTicket và handleCancel như cũ) ...
  const fetchTicket = async () => {
    try {
      const res = await getMyLatestTicket();
      if (res.success) {
        setTicket(res.ticket);
        if (res.ticket?.isPaid && showPayment) {
            setShowPayment(false);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    const interval = setInterval(fetchTicket, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async () => {
    if (!ticket) return;
    if (confirm(`Bạn có chắc chắn muốn hủy số thứ tự #${ticket.ticketNumber} không?`)) {
      setCancelling(true);
      try {
        const res = await cancelQueueTicket(ticket.id);
        if (res.success) router.push('/queue'); 
        else alert(res.error || 'Lỗi khi hủy vé');
      } catch (err) {
        alert('Có lỗi xảy ra');
      } finally {
        setCancelling(false);
      }
    }
  };

  // --- Màn hình Loading ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Đang tải vé của bạn...</p>
    </div>
  );

  // --- Màn hình Không có vé ---
  if (!ticket) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Scissors className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa có vé nào</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Bạn hiện không có vé đang chờ. Hãy lấy số mới để được phục vụ nhé.</p>
        <Link href="/queue" className="px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 hover:scale-105 transition-all shadow-xl">
            Lấy số ngay
        </Link>
    </div>
  );

  // --- Logic hiển thị trạng thái ---
  const currentPosition = ticket.position ?? 0;
  const status = ticket.status;
  const isServing = ['SERVING', 'FINISHING', 'IN_PROGRESS'].includes(status);
  const isProcessing = status === 'PROCESSING';
  const isCalling = status === 'CALLING';
  const isWaiting = status === 'WAITING';
  const canPay = !ticket.isPaid && ticket.totalPrice > 0;

  const estimatedWaitMinutes = currentPosition > 0 ? currentPosition * AVG_SERVICE_MINUTES + 5 : 5;
  let timeDisplay = `${estimatedWaitMinutes} phút`;
  let statusText = 'Đang xếp hàng';
  let statusDesc = `Còn ${currentPosition} người nữa là đến lượt bạn.`;
  let StatusIcon = Clock;
  let themeColor = 'blue'; 

  if (isServing) {
    statusText = 'Đang phục vụ';
    statusDesc = 'Thợ đang thực hiện dịch vụ cho bạn.';
    StatusIcon = Scissors;
    themeColor = 'green';
    timeDisplay = 'Bây giờ';
  } else if (isProcessing) {
    statusText = 'Đang xử lý';
    statusDesc = 'Vui lòng ngồi đợi thuốc ngấm.';
    StatusIcon = Sparkles;
    themeColor = 'purple';
    timeDisplay = 'Đang làm';
  } else if (isCalling) {
    statusText = 'Đang gọi!';
    statusDesc = 'Vui lòng đến quầy ngay lập tức.';
    StatusIcon = AlertCircle;
    themeColor = 'yellow';
    timeDisplay = 'Ngay lập tức';
  } else if (status === 'FINISHING') {
    statusText = 'Hoàn thiện';
    statusDesc = 'Sấy tóc và tạo kiểu.';
    StatusIcon = CheckCircle2;
    themeColor = 'teal';
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      {/* --- HEADER --- */}
      <header className="bg-white sticky top-0 z-30 border-b border-gray-200/50 backdrop-blur-md bg-white/80">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/queue" className="flex items-center gap-2 text-gray-600 hover:text-black transition p-2 -ml-2 rounded-lg hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold text-sm">Quay lại</span>
            </Link>
            <h1 className="font-bold text-gray-900">Vé điện tử</h1>
            <div className="w-8"></div> {/* Spacer để cân giữa */}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        
        {/* 1. STATUS CARD (Thông báo trạng thái) */}
        <div className={`
            relative overflow-hidden rounded-3xl p-6 shadow-sm border
            ${themeColor === 'green' ? 'bg-green-600 border-green-500 text-white' : ''}
            ${themeColor === 'yellow' ? 'bg-yellow-500 border-yellow-400 text-white' : ''}
            ${themeColor === 'purple' ? 'bg-purple-600 border-purple-500 text-white' : ''}
            ${themeColor === 'blue' ? 'bg-white border-gray-200 text-gray-900' : ''}
        `}>
            {/* Background Pattern cho trạng thái Waiting (Blue) */}
            {themeColor === 'blue' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            )}

            <div className="relative z-10 flex items-start gap-4">
                <div className={`
                    p-3 rounded-2xl shrink-0
                    ${themeColor === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-white/20 text-white'}
                `}>
                    <StatusIcon className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-xl font-bold leading-tight">{statusText}</h2>
                    <p className={`mt-1 text-sm ${themeColor === 'blue' ? 'text-gray-500' : 'text-white/90'}`}>
                        {statusDesc}
                    </p>
                    
                    {/* Badge thời gian */}
                    <div className={`
                        inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold
                        ${themeColor === 'blue' ? 'bg-gray-100 text-gray-700' : 'bg-black/20 text-white'}
                    `}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Thời gian: {timeDisplay}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. VÉ (TICKET COMPONENT) */}
        <div className="transform transition-all hover:scale-[1.01]">
            <QueueTicket 
                queueNumber={ticket.ticketNumber}
                customerName={ticket.guestName || ticket.customerName || 'Bạn'}
                services={ticket.serviceNames || ticket.serviceIds || []} 
                estimatedTime={timeDisplay}
                position={currentPosition}
                status={status}
                onCancel={handleCancel}
            />
        </div>

        {/* 3. NÚT THANH TOÁN (Sticky hoặc nổi bật) */}
        {canPay && (
            <div className=" bottom-6 left-4 right-4 max-w-2xl mx-auto z-40 animate-in slide-in-from-bottom-4 duration-500">
                <button 
                    onClick={() => setShowPayment(true)}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 border border-gray-700/50"
                >
                    <CreditCard className="w-6 h-6" />
                    Thanh toán ({ticket.totalPrice.toLocaleString()}đ)
                </button>
            </div>
        )}

        {/* 4. INFO / HƯỚNG DẪN */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Hướng dẫn
            </h3>
            <ul className="space-y-4">
                <li className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center font-bold text-sm text-gray-500 shrink-0">1</div>
                    <p className="text-sm text-gray-600 pt-1.5">Theo dõi số thứ tự trên màn hình này. Trang sẽ tự động cập nhật.</p>
                </li>
                <li className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center font-bold text-sm text-gray-500 shrink-0">2</div>
                    <p className="text-sm text-gray-600 pt-1.5">Vui lòng đến cửa hàng <span className="font-bold text-gray-900">trước 10 phút</span> nếu bạn đang ở xa.</p>
                </li>
                <li className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center font-bold text-sm text-gray-500 shrink-0">3</div>
                    <p className="text-sm text-gray-600 pt-1.5">Khi được gọi, hãy đưa <span className="font-bold text-gray-900">mã QR trên vé</span> cho nhân viên lễ tân.</p>
                </li>
            </ul>
            
            <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>1Hòa Tiến-Hòa Vang-Đà Nẵng</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                    <Phone className="w-4 h-4" />
                    <span>Hotline: xxxxxxx</span>
                </div>
            </div>
        </div>

        {/* Khoảng trống để không bị nút thanh toán che nếu có */}
        {canPay && <div className="h-24"></div>}
      </main>

      {/* Modal */}
      {showPayment && (
        <PaymentModal ticket={ticket} onClose={() => setShowPayment(false)} />
      )}
    </div>
  );
}