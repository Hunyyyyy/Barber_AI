// components/queue/QueueDetailModal.tsx
"use client";

import { cancelTicketByBarber } from "@/actions/queue.actions"; // Import action mới
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, Calendar, Clock, Loader2, MapPin, Phone, Scissors, Trash2, User, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import CompleteTicketButton from "./CompleteTicketButton";

// ... (Giữ nguyên các interface Service, TicketDetail, QueueDetailModalProps)
interface ServiceItem {
  priceSnapshot: number; // Giá tại thời điểm đặt
  service: {
    name: string;
    price: number;
    durationWork?: number;
  };
}

interface TicketDetail {
  id: string;
  ticketNumber: number;
  guestName: string;
  phone?: string;
  status: string;
  totalPrice: number;
  createdAt: string; 
  services: ServiceItem[];
  barber?: {
    name: string;
    id: string;
  };
  user?: {
    avatarUrl?: string;
    fullName?: string;
  };
}

interface QueueDetailModalProps {
  ticket: TicketDetail;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: string | null; 
}

export default function QueueDetailModal({ ticket, isOpen, onClose, currentUserRole }: QueueDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  
  // --- STATE CHO NÚT HỦY (Đếm ngược) ---
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  // Logic đếm ngược
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showCancelConfirm && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showCancelConfirm, countdown]);

  const handleCancelClick = () => {
      if (!showCancelConfirm) {
          // Lần đầu bấm: Hiện xác nhận và bắt đầu đếm ngược
          setShowCancelConfirm(true);
          setCountdown(5);
      } else {
          // Lần hai bấm (Sau khi hết giờ): Thực hiện hủy
          if (countdown > 0) return; // Chặn nếu chưa hết giờ
          
          startTransition(async () => {
             const res = await cancelTicketByBarber(ticket.id);
             if (res.success) {
                 onClose(); // Đóng modal nếu thành công
             } else {
                 alert(res.error);
             }
          });
      }
  };

  if (!mounted || !isOpen) return null;

  const timeString = new Date(ticket.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateString = new Date(ticket.createdAt).toLocaleDateString('vi-VN');
  const isServing = ['SERVING', 'PROCESSING'].includes(ticket.status);
  const isDone = ticket.status === 'COMPLETED';
  const isCancelled = ['CANCELLED', 'SKIPPED'].includes(ticket.status);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card md:rounded-3xl rounded-t-[2rem] shadow-2xl flex flex-col max-h-[90dvh] animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-border flex justify-between items-start bg-muted/30 rounded-t-[2rem] shrink-0">
            <div>
                <p className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground tracking-widest mb-1">Số thứ tự</p>
                <h2 className="text-4xl md:text-5xl font-black text-foreground leading-none">#{ticket.ticketNumber}</h2>
            </div>
            <button onClick={onClose} className="p-2.5 -mr-2 -mt-2 bg-transparent hover:bg-accent rounded-full transition-colors active:bg-muted">
                <X className="w-6 h-6 text-muted-foreground" />
            </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 overscroll-contain">
            
            {/* 1. Thông tin khách hàng */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center shrink-0">
                    {ticket.user?.avatarUrl ? (
                        <img src={ticket.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-foreground truncate">{ticket.guestName || ticket.user?.fullName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{ticket.phone || "Khách vãng lai"}</span>
                    </div>
                </div>
            </div>

            {/* 2. Trạng thái & Thợ */}
            <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border flex flex-col gap-1 ${isServing ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-background border-border'}`}>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Trạng thái</span>
                    <span className={`font-bold flex items-center gap-1.5 text-sm md:text-base ${isServing ? 'text-indigo-600 dark:text-indigo-300' : 'text-foreground'}`}>
                        {isServing && <Scissors className="w-4 h-4 animate-bounce" />}
                        {ticket.status}
                    </span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-background flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Thợ cắt</span>
                    <span className="font-bold text-foreground truncate text-sm md:text-base">
                        {ticket.barber?.name || "Chờ xếp..."}
                    </span>
                </div>
            </div>

            {/* 3. Dịch vụ & Giá */}
            <div className="space-y-3">
                <h4 className="text-xs md:text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Scissors className="w-4 h-4" /> Chi tiết dịch vụ
                </h4>
                <div className="divide-y divide-border border border-border rounded-xl bg-background overflow-hidden">
                    {ticket.services.map((item, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center hover:bg-muted/50 transition-colors">
                            {/* Gọi item.service.name thay vì item.name */}
                            <span className="font-medium text-sm text-foreground/90">
                                {item.service?.name || "Dịch vụ"}
                            </span>
                            {/* Gọi item.priceSnapshot thay vì item.price */}
                            <span className="font-bold text-sm text-foreground">
                                {formatCurrency(item.priceSnapshot || item.service?.price || 0)}
                            </span>
                        </div>
                    ))}
                    
                    {/* Tổng tiền */}
                    <div className="p-3 bg-muted/30 flex justify-between items-center">
                        <span className="font-bold text-sm text-foreground">Tổng cộng</span>
                        <span className="font-black text-lg text-primary">{formatCurrency(ticket.totalPrice)}</span>
                    </div>
                </div>
            </div>

            {/* 4. Metadata (Thời gian) */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border border-dashed">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> {dateString}
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {timeString}
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                    <MapPin className="w-3.5 h-3.5" /> Tại quán
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        {!isDone && !isCancelled && (
            <div className="p-4 pb-8 md:pb-4 border-t border-border bg-muted/20 shrink-0">
                {(currentUserRole === 'BARBER' || currentUserRole === 'ADMIN') ? (
                    // ACTION CHO THỢ
                    <div className="grid grid-cols-2 gap-3">
                         <button 
                            onClick={handleCancelClick}
                            className={`
                                py-3.5 rounded-xl font-bold text-sm border transition-all active:scale-95 flex items-center justify-center gap-2
                                ${showCancelConfirm 
                                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                                    : 'bg-background text-foreground border-border hover:bg-accent'
                                }
                            `}
                         >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : showCancelConfirm ? (
                                countdown > 0 ? (
                                    <>Chờ {countdown}s...</>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" /> Xác nhận Hủy
                                    </>
                                )
                            ) : (
                                "Bỏ qua / Hủy"
                            )}
                         </button>
                         
                         <div className="w-full [&>button]:w-full [&>button]:h-full [&>button]:py-3.5 [&>button]:text-base [&>button]:justify-center [&>button]:rounded-xl">
                            {/* Ẩn nút hoàn thành nếu đang trong mode hủy để tránh bấm nhầm */}
                            {!showCancelConfirm && <CompleteTicketButton ticketId={ticket.id} />}
                         </div>
                         
                         {/* Cảnh báo khi bật mode hủy */}
                         {showCancelConfirm && (
                             <div className="col-span-2 text-[10px] text-red-500 text-center font-medium animate-pulse flex items-center justify-center gap-1 mt-1">
                                 <AlertTriangle className="w-3 h-3" />
                                 Hành động này sẽ hủy vé và không thể hoàn tác!
                             </div>
                         )}
                    </div>
                ) : (
                    // ACTION CHO KHÁCH (Giữ nguyên)
                    <button className="w-full py-3.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 active:scale-95">
                        <X className="w-4 h-4" /> Hủy vé này
                    </button>
                )}
            </div>
        )}
      </div>
    </div>,
    document.body
  );
}