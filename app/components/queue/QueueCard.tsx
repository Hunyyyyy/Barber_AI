// components/queue/QueueCard.tsx
import { Clock, Hourglass, Sparkles, Users } from 'lucide-react';

interface QueueCardProps {
  waitingCount: number;
  generalWaitTime: number; // Thời gian chờ chung (cho khách mới)
  myWaitTime?: number;     // Thời gian chờ của user (nếu có vé)
  hasTicket: boolean;      // User đã có vé chưa
}

export default function QueueCard({ 
  waitingCount, 
  generalWaitTime, 
  myWaitTime = 0, 
  hasTicket 
}: QueueCardProps) {
  
  // Xác định thời gian hiển thị
  // Nếu có vé -> Hiện thời gian của mình. Nếu không -> Hiện thời gian chung
  const displayTime = hasTicket ? myWaitTime : generalWaitTime;
  
  // Label hiển thị
  const titleLabel = hasTicket ? "Đến lượt bạn trong" : "Thời gian chờ dự kiến";
  const subLabel = hasTicket 
    ? (myWaitTime === 0 ? "Đang được phục vụ!" : "Hãy chuẩn bị sẵn sàng") 
    : "Nếu bạn lấy số ngay bây giờ";

  return (
    <div className={`
      w-full max-w-lg mx-auto p-5 md:p-6 rounded-2xl shadow-xl mb-6 relative overflow-hidden group transition-all duration-500
      ${hasTicket 
        ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-orange-500/20" 
        : "bg-primary text-primary-foreground shadow-primary/20"
      }
    `}>
      {/* Background Effect */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-80 mb-1 flex items-center gap-1">
            {hasTicket && <Sparkles className="w-3 h-3 animate-pulse" />}
            Trạng thái quán
          </h2>
          <div className="flex items-end gap-2">
            <span className="text-4xl md:text-5xl font-black leading-none tracking-tighter">{waitingCount}</span>
            <span className="text-sm md:text-base font-medium opacity-90 mb-1">khách đang chờ</span>
          </div>
        </div>
        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm shadow-inner border border-white/10">
          <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/20 flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {hasTicket ? <Hourglass className="w-4 h-4 opacity-90 animate-spin-slow" /> : <Clock className="w-4 h-4 opacity-80" />}
            <span className="text-xs md:text-sm font-bold opacity-90 uppercase tracking-wide">
              {titleLabel}
            </span>
          </div>
          <span className="text-[10px] opacity-70 mt-0.5 ml-6">{subLabel}</span>
        </div>

        <div className="text-right">
            {hasTicket && myWaitTime === 0 ? (
                <span className="text-lg md:text-xl font-black tracking-tight animate-pulse">NGAY BÂY GIỜ</span>
            ) : (
                <span className="text-2xl md:text-3xl font-black tracking-tighter">
                  ~{displayTime}<span className="text-sm font-medium align-top ml-0.5">phút</span>
                </span>
            )}
        </div>
      </div>
    </div>
  );
}