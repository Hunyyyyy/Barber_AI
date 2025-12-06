'use client';

import { checkTicketPaymentStatus, getShopSettings } from '@/actions/queue.actions';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, Check, Copy, Download, Loader2, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PaymentModalProps {
  ticket: any;
  onClose: () => void;
}

export default function PaymentModal({ ticket, onClose }: PaymentModalProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // State để xử lý tiền thiếu/đủ
  const [paidAmount, setPaidAmount] = useState(0); // Khách đã đóng
  const [remainingAmount, setRemainingAmount] = useState(ticket.totalPrice); // Khách còn thiếu
  
  // State cấu hình ngân hàng (lấy từ DB)
  const [bankConfig, setBankConfig] = useState<any>(null);

  // 1. Lấy cấu hình ngân hàng lúc mở modal
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getShopSettings();
        if(settings) setBankConfig(settings);
      } catch (error) {
        console.error("Lỗi lấy cấu hình ngân hàng", error);
      }
    };
    fetchSettings();
  }, []);

  // 2. Logic Polling kiểm tra trạng thái (Chạy mỗi 3s)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      if (paymentSuccess) return;
      
      const res = await checkTicketPaymentStatus(ticket.id);
      
      if (res.success) {
        // Cập nhật số tiền thực tế khách đã chuyển
        setPaidAmount(res.amountPaid || 0);
        
        // --- TRƯỜNG HỢP 1: ĐÃ XONG (Đủ hoặc Dư) ---
        if (res.isPaid) {
          setPaymentSuccess(true);
          clearInterval(intervalId);
          setTimeout(() => {
              onClose();
              window.location.reload(); 
          }, 3000); // Đợi 3s để khách đọc thông báo rồi reload
        } 
        // --- TRƯỜNG HỢP 2: CHUYỂN THIẾU ---
        else {
            // Tính số tiền còn thiếu để cập nhật QR
            const left = (res.totalPrice || ticket.totalPrice) - (res.amountPaid || 0);
            setRemainingAmount(left > 0 ? left : 0);
        }
      }
    };

    // Chạy ngay lần đầu
    checkStatus(); 
    // Setup interval
    intervalId = setInterval(checkStatus, 3000); 

    return () => clearInterval(intervalId);
  }, [ticket.id, paymentSuccess, onClose, ticket.totalPrice]);

  // --- CẤU HÌNH QR CODE ---
  // Nội dung chuyển khoản cố định
  const transferContent = `BARBER ${ticket.ticketNumber}`;
  
  // Default values nếu chưa load xong setting (Fallback an toàn)
  const bankId = bankConfig?.bankName || 'MB';
  const accountNo = bankConfig?.bankAccountNo || '0795516929'; // Sẽ update khi load xong DB
  const accountName = bankConfig?.bankAccountName || 'BARBER SHOP';
  const template = bankConfig?.qrTemplate || 'compact2';
  
  // Tạo link QR động: Luôn tạo theo số tiền CÒN THIẾU (remainingAmount)
  const qrImgUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${remainingAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

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

  const openMomo = () => { window.location.href = "momo://"; };
  const openZaloPay = () => { window.location.href = "zalopay://"; };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* === OVERLAY THÀNH CÔNG === */}
        {paymentSuccess && (
            <div className="absolute inset-0 z-50 bg-green-500 flex flex-col items-center justify-center text-primary-foreground animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce">
                    <Check className="w-12 h-12 text-green-600 stroke-[4]" />
                </div>
                <h3 className="text-3xl font-black">Thanh toán xong!</h3>
                <p className="opacity-90 mt-2 font-medium">Cảm ơn quý khách.</p>
                
                {/* Hiện thông báo nếu khách chuyển dư (Tip) */}
                {paidAmount > ticket.totalPrice && (
                    <div className="mt-4 bg-green-600/50 px-4 py-2 rounded-lg text-sm font-semibold">
                        Đã nhận dư: {formatCurrency(paidAmount - ticket.totalPrice)} (Tip ❤️)
                    </div>
                )}
                
                <p className="text-xs mt-8 opacity-75">Tự động đóng sau giây lát...</p>
            </div>
        )}

        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-muted/30 shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            Thanh toán
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Tự động</span>
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-muted/80 rounded-full"><X className="w-5 h-5"/></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
          
          {/* === CẢNH BÁO NẾU CHUYỂN THIẾU === */}
          {paidAmount > 0 && remainingAmount > 0 && (
              <div className="w-full bg-red-100 border border-red-200 text-red-800 p-3 rounded-xl mb-4 text-sm flex gap-2 items-start animate-pulse">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                      <span className="font-bold block">Chưa đủ tiền!</span>
                      Bạn đã chuyển <b>{formatCurrency(paidAmount)}</b>. <br/>
                      Vui lòng quét mã bên dưới để chuyển nốt <b>{formatCurrency(remainingAmount)}</b>.
                  </div>
              </div>
          )}

          {/* QR Image */}
          <div className="bg-card p-2 border-2 border-black rounded-2xl shadow-lg relative group w-full max-w-[220px] mx-auto mb-4">
            {bankConfig ? (
                <img src={qrImgUrl} alt="Mã QR thanh toán" className="w-full h-auto object-contain rounded-xl" />
            ) : (
                <div className="w-full h-[220px] flex items-center justify-center bg-gray-100 rounded-xl">
                    <Loader2 className="animate-spin text-gray-400" />
                </div>
            )}
          </div>

          <div className="text-center mb-6">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
                {remainingAmount < ticket.totalPrice ? 'Số tiền còn lại' : 'Tổng tiền'}
            </p>
            <p className="text-4xl font-black text-foreground tracking-tighter text-blue-600">
                {formatCurrency(remainingAmount)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full mb-6">
              <button 
                onClick={handleDownloadQR}
                className="col-span-2 py-3 bg-muted hover:bg-muted/80 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                Lưu ảnh QR
              </button>
              
              <button onClick={openMomo} className="py-3 bg-[#A50064] text-white rounded-xl font-bold text-xs hover:opacity-90 transition">
                Mở Momo
              </button>
              <button onClick={openZaloPay} className="py-3 bg-[#0068FF] text-white rounded-xl font-bold text-xs hover:opacity-90 transition">
                Mở ZaloPay
              </button>
          </div>

          {/* Copy Info (Dynamic Data) */}
          <div className="w-full bg-yellow-50 p-3 rounded-xl border border-yellow-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                  <span className="text-yellow-800">Ngân hàng: <b className="font-bold">{bankId}</b></span>
              </div>
              <div className="flex justify-between items-center text-xs">
                  <span className="text-yellow-800">STK: <b className="font-mono text-sm">{accountNo}</b></span>
                  <Copy className="w-3 h-3 text-yellow-600 cursor-pointer hover:scale-125 transition" onClick={() => navigator.clipboard.writeText(accountNo)}/>
              </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-yellow-800">Chủ TK: <b className="font-bold">{accountName}</b></span>
              </div>
              <div className="h-px bg-yellow-200"></div>
              <div className="flex justify-between items-center text-xs">
                  <span className="text-yellow-800">Nội dung: <b className="font-mono text-sm">{transferContent}</b></span>
                  <Copy className="w-3 h-3 text-yellow-600 cursor-pointer hover:scale-125 transition" onClick={() => navigator.clipboard.writeText(transferContent)}/>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 shrink-0 space-y-3">
           <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-bold animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin"/>
                Đang chờ tin nhắn từ ngân hàng...
           </div>

           {/* Manual Check Button */}
           <button 
             onClick={async () => {
                 setIsChecking(true);
                 const res = await checkTicketPaymentStatus(ticket.id);
                 setIsChecking(false);
                 const currentPaid = res.amountPaid || 0;
                 if(res.success && res.isPaid) {
                     setPaymentSuccess(true);
                 } else if (res.success && currentPaid> 0) {
                     // Nếu bấm kiểm tra mà thấy thiếu tiền -> Cập nhật UI ngay
                     setPaidAmount(currentPaid);
                     setRemainingAmount(res.remaining || 0);
                     alert(`Hệ thống mới nhận được ${formatCurrency(currentPaid)}. Vui lòng chuyển thêm!`);
                 } else {
                     alert("Hệ thống chưa nhận được tiền. Vui lòng thử lại sau vài giây.");
                 }
             }}
             disabled={isChecking}
             className="w-full py-3 rounded-xl font-bold text-primary-foreground bg-primary hover:bg-neutral-800 transition flex items-center justify-center gap-2"
           >
             {isChecking ? <Loader2 className="animate-spin w-4 h-4"/> : <RefreshCw className="w-4 h-4"/>}
             Kiểm tra ngay
           </button>
        </div>
      </div>
    </div>
  );
}