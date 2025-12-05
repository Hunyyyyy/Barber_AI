// components/queue/CurrentQueueList.tsx
import { AlertCircle, Clock, Crown, Scissors, Sparkles } from 'lucide-react';
import CompleteTicketButton from './CompleteTicketButton';
// THÊM highlightPhone VÀO ĐÂY
interface CurrentQueueListProps {
  queue: any[]; // Dùng any tạm hoặc type chính xác từ Prisma include
  highlightTicketId?: string; // <-- Đổi thành ID
  currentUserRole?: string | null;
}

export default function CurrentQueueList({ 
  queue, highlightTicketId,currentUserRole }: CurrentQueueListProps) { 
    console.log('CurrentQueueList - currentUserRole:', currentUserRole);
   if (queue.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Clock className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">Chưa có khách nào đang chờ</p>
        <p className="text-sm text-gray-400 mt-2">Hãy lấy số để trở thành người đầu tiên!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 bg-black text-white flex justify-between items-center">
        <h3 className="font-bold text-lg">Hàng đợi hiện tại</h3>
        <span className="text-xs bg-white text-black px-3 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          LIVE
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {queue.map((item) => {
          // Logic so sánh ID
          const isMyTicket = highlightTicketId && item.id === highlightTicketId;
          const isInProgress = ['SERVING', 'FINISHING', 'PROCESSING', 'CALLING'].includes(item.status);
          const showFinishButton = currentUserRole === 'BARBER' && 
                                   ['SERVING', 'FINISHING'].includes(item.status);
          // Trạng thái chờ xử lý thuốc (Ngấm thuốc) -> Thợ rảnh tay nhưng khách chưa xong
          const isProcessing = item.status === 'PROCESSING';
          
          const isOverdue = item.status === 'SKIPPED' || item.status === 'CANCELLED';
          // Lấy thông tin Avatar & Tên
          const avatarUrl = item.user?.avatarUrl;
          const displayName = item.guestName || item.user?.fullName || 'Khách vãng lai';
          const initial = displayName.charAt(0).toUpperCase();
          return (
            <div
              key={item.id}
              className={`
                p-5 flex items-center justify-between transition-all
                ${isMyTicket ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500' : ''}
                ${isInProgress ? 'bg-indigo-50/70' : ''}
                ${isOverdue ? 'bg-red-50/70' : 'hover:bg-gray-50'}
              `}
            >
              <div className="flex items-center gap-4">
                
                {/* --- [SỬA] KHU VỰC AVATAR (Thay vì số thứ tự to đùng) --- */}
                <div className="relative">
                    <div className={`
                        w-14 h-14 rounded-full border-2 overflow-hidden flex items-center justify-center
                        ${isMyTicket ? 'border-amber-500 shadow-md' : 'border-gray-200'}
                        ${isInProgress ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}
                        bg-gray-100
                    `}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-black text-xl text-gray-400 select-none">
                                {initial}
                            </span>
                        )}
                    </div>
                    
                    {/* Icon Crown nếu là vé của tôi */}
                    {isMyTicket && (
                        <div className="absolute -top-2 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                            <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                        </div>
                    )}
                </div>

                {/* KHU VỰC THÔNG TIN */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {/* [MỚI] Số thứ tự chuyển thành Badge nhỏ */}
                    <span className={`
                        px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider
                        ${isMyTicket ? 'bg-amber-500 text-white' : 'bg-black text-white'}
                    `}>
                        Vé #{item.ticketNumber}
                    </span>

                    <p className="font-bold text-gray-900 text-lg leading-none">
                        {displayName}
                    </p>
                  </div>
                  
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 pl-0.5">
                    {isInProgress ? (
                      <>
                        <Scissors className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-medium text-indigo-900">
                          {isProcessing 
                            ? 'Đang ngấm thuốc...' 
                            : item.barber 
                              ? `Đang làm: ${item.barber.name}` 
                              : 'Đang phục vụ'
                          }
                        </span>
                      </>
                    ) : isOverdue ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-red-600 font-bold">ĐÃ HỦY</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        Đang chờ...
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* KHU VỰC ACTION / ICON TRẠNG THÁI (Bên phải) */}
              <div className="flex items-center gap-2">
                {showFinishButton && <CompleteTicketButton ticketId={item.id} />}
                
                {isProcessing && <Sparkles className="w-6 h-6 text-purple-500 animate-spin-slow" />}
                {!isProcessing && isInProgress && !showFinishButton && <Scissors className="w-6 h-6 text-indigo-600 animate-bounce" />}
                {isOverdue && <AlertCircle className="w-6 h-6 text-red-600" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}