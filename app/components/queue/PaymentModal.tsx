'use client';

import { checkTicketPaymentStatus } from '@/actions/queue.actions';
import { formatCurrency } from '@/lib/utils';
import { Check, Copy, Download, Loader2, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

// CẤU HÌNH TÀI KHOẢN
const BANK_ID = 'MB'; 
const ACCOUNT_NO = '0795516929'; 
const ACCOUNT_NAME = 'Ngo Nhat Huy'; 
const TEMPLATE = 'compact2'; 
const MONEYTEST='1000'
interface PaymentModalProps {
  ticket: any;
  onClose: () => void;
}

export default function PaymentModal({ ticket, onClose }: PaymentModalProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // 1. Tạo nội dung & Link QR
  const transferContent = `BARBER ${ticket.ticketNumber}`; 
  //const qrImgUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${ticket.totalPrice}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
    const qrImgUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${MONEYTEST}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
  // --- LOGIC TỰ ĐỘNG KIỂM TRA (POLLING) ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      if (paymentSuccess) return;
      // Gọi Server Action kiểm tra trạng thái
      const res = await checkTicketPaymentStatus(ticket.id);
      
      if (res.success && res.isPaid) {
        setPaymentSuccess(true);
        clearInterval(intervalId);
        
        // Đợi 2s để hiển thị màn hình thành công rồi đóng
        setTimeout(() => {
            onClose();
            window.location.reload(); 
        }, 2500);
      }
    };

    checkStatus(); // Check ngay lập tức
    intervalId = setInterval(checkStatus, 3000); // Lặp lại mỗi 3s

    return () => clearInterval(intervalId);
  }, [ticket.id, paymentSuccess, onClose]);

  // --- HÀM TẢI ẢNH QR ---
  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImgUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR-Barber-${ticket.ticketNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Không thể tải ảnh, vui lòng chụp màn hình!');
    }
  };

  // --- HÀM MỞ CÁC VÍ ĐIỆN TỬ (Deep Link) ---
  // Lưu ý: Momo/ZaloPay có hỗ trợ link mở app, nhưng cần cấu hình đúng format
  // Đây là ví dụ mở app, việc điền sẵn thông tin phụ thuộc vào API của từng ví
  const openMomo = () => {
     // Link chuyển tiền Momo (Cần thay số điện thoại ví Momo của bạn vào)
     // Cấu trúc deep link Momo khá phức tạp và thay đổi, đây là link mở app cơ bản
     window.location.href = "momo://"; 
  };
  
  const openZaloPay = () => {
     window.location.href = "zalopay://";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* OVERLAY THÀNH CÔNG */}
        {paymentSuccess && (
            <div className="absolute inset-0 z-50 bg-green-500 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce">
                    <Check className="w-12 h-12 text-green-600 stroke-[4]" />
                </div>
                <h3 className="text-3xl font-black">Thanh toán xong!</h3>
                <p className="opacity-90 mt-2 font-medium">Cảm ơn quý khách.</p>
                <p className="text-xs mt-8 opacity-75">Tự động đóng sau giây lát...</p>
            </div>
        )}

        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            Thanh toán
            <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">Tự động</span>
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5"/></button>
        </div>

        {/* Body (Scrollable nếu màn hình nhỏ) */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
          
          {/* QR Image */}
          <div className="bg-white p-2 border-2 border-black rounded-2xl shadow-lg relative group w-full max-w-[220px] mx-auto mb-4">
             <img src={qrImgUrl} alt="Mã QR thanh toán" className="w-full h-auto object-contain rounded-xl" />
          </div>

          <div className="text-center mb-6">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Số tiền</p>
            <p className="text-4xl font-black text-black tracking-tighter">{formatCurrency(ticket.totalPrice)}</p>
          </div>

          {/* Action Buttons cho Mobile */}
          <div className="grid grid-cols-2 gap-3 w-full mb-6">
              <button 
                onClick={handleDownloadQR}
                className="col-span-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                1. Lưu ảnh QR về máy
              </button>
              
              <div className="col-span-2 text-center text-xs text-gray-400 my-1">
                  Sau đó mở App Ngân hàng chọn "Quét ảnh"
              </div>

              {/* Deep Link (Optional) */}
              <button onClick={openMomo} className="py-3 bg-[#A50064] text-white rounded-xl font-bold text-xs hover:opacity-90">
                Mở Momo
              </button>
              <button onClick={openZaloPay} className="py-3 bg-[#0068FF] text-white rounded-xl font-bold text-xs hover:opacity-90">
                Mở ZaloPay
              </button>
          </div>

          {/* Copy Info (Fallback) */}
          <div className="w-full bg-yellow-50 p-3 rounded-xl border border-yellow-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                  <span className="text-yellow-800">STK: <b className="font-mono text-sm">{ACCOUNT_NO}</b></span>
                  <Copy className="w-3 h-3 text-yellow-600 cursor-pointer" onClick={() => navigator.clipboard.writeText(ACCOUNT_NO)}/>
              </div>
              <div className="h-px bg-yellow-200"></div>
              <div className="flex justify-between items-center text-xs">
                  <span className="text-yellow-800">Nội dung: <b className="font-mono text-sm">{transferContent}</b></span>
                  <Copy className="w-3 h-3 text-yellow-600 cursor-pointer" onClick={() => navigator.clipboard.writeText(transferContent)}/>
              </div>
          </div>
        </div>

        {/* Footer: Trạng thái & Nút Check */}
        <div className="p-4 border-t bg-gray-50 shrink-0 space-y-3">
           {/* Auto Loading Indicator */}
           <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-bold animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin"/>
                Đang chờ tin nhắn từ ngân hàng...
           </div>

           {/* Manual Check Button (Ẩn đi nếu muốn hoàn toàn tự động, nhưng nên để làm fallback) */}
           <button 
             onClick={async () => {
                 setIsChecking(true);
                 const res = await checkTicketPaymentStatus(ticket.id);
                 setIsChecking(false);
                 if(res.success && res.isPaid) setPaymentSuccess(true);
                 else alert("Hệ thống chưa nhận được tiền. Vui lòng thử lại sau vài giây.");
             }}
             disabled={isChecking}
             className="w-full py-3 rounded-xl font-bold text-white bg-black hover:bg-neutral-800 transition flex items-center justify-center gap-2"
           >
             {isChecking ? <Loader2 className="animate-spin w-4 h-4"/> : <RefreshCw className="w-4 h-4"/>}
             Kiểm tra ngay
           </button>
        </div>
      </div>
    </div>
  );
}