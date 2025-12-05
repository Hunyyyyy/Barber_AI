// components/queue/CurrentQueueList.tsx
import { AlertCircle, Clock, Crown, Scissors, Sparkles } from 'lucide-react';


// THÊM highlightPhone VÀO ĐÂY
interface CurrentQueueListProps {
  queue: any[]; // Dùng any tạm hoặc type chính xác từ Prisma include
  highlightTicketId?: string; // <-- Đổi thành ID
}

export default function CurrentQueueList({ queue, highlightTicketId }: CurrentQueueListProps) { 
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
          
          // Trạng thái chờ xử lý thuốc (Ngấm thuốc) -> Thợ rảnh tay nhưng khách chưa xong
          const isProcessing = item.status === 'PROCESSING';
          
          const isOverdue = item.status === 'SKIPPED' || item.status === 'CANCELLED';
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
                {/* Số thứ tự */}
                <div className={`
                  relative w-12 h-12 rounded-full flex items-center justify-center font-black text-lg
                  ${isMyTicket ? 'bg-amber-500 text-white shadow-lg' : ''}
                  ${isInProgress ? 'bg-black text-white animate-pulse' : ''}
                  ${isOverdue ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}
                `}>
                  {isMyTicket && <Crown className="w-5 h-5 absolute -top-2 -right-2 text-amber-600" />}
                  {item.ticketNumber}
                </div>

                <div>
                  <p className="font-bold text-gray-900 flex items-center gap-2">
                    {item.guestName || item.user?.fullName || item.customerName || 'Khách vãng lai'}
                    {isMyTicket && (
                      <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                        BẠN
                      </span>
                    )}
                  </p>
                  
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                    {isInProgress ? (
                      <>
                        <Scissors className="w-4 h-4 text-indigo-600" />
                        <span className="font-medium text-indigo-900">
                          {isProcessing 
                            ? 'Đang ngấm thuốc (Thợ chờ)' 
                            : item.barber 
                              ? `Đang làm với ${item.barber.name}` 
                              : 'Đang được phục vụ'
                          }
                        </span>
                      </>
                    ) : isOverdue ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-red-600 font-bold">ĐÃ HỦY / BỎ QUA</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-gray-500" />
                        Đang chờ...
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Icon status bên phải */}
              <div>
                {isProcessing && <Sparkles className="w-6 h-6 text-purple-500 animate-spin-slow" />}
                {!isProcessing && isInProgress && <Scissors className="w-6 h-6 text-indigo-600 animate-bounce" />}
                {isOverdue && <AlertCircle className="w-6 h-6 text-red-600" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}