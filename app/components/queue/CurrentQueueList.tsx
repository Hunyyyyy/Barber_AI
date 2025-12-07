// components/queue/CurrentQueueList.tsx
"use client";

import { AlertCircle, ChevronDown, ChevronRight, ChevronUp, Clock, Crown, Scissors, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import CompleteTicketButton from './CompleteTicketButton';
import QueueDetailModal from './QueueDetailModal';

interface CurrentQueueListProps {
  queue: any[];
  highlightTicketId?: string;
  currentUserRole?: string | null;
  currentUserId?: string;
}

// Số lượng khách chờ hiển thị mặc định
const INITIAL_WAITING_LIMIT = 5;

export default function CurrentQueueList({ 
  queue, highlightTicketId, currentUserRole, currentUserId 
}: CurrentQueueListProps) { 
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Tách danh sách thành 2 nhóm: Đang làm & Đang chờ
  const { activeQueue, waitingQueue } = useMemo(() => {
    const active: any[] = [];
    const waiting: any[] = [];

    queue.forEach(item => {
      // Các trạng thái được coi là "Đang hoạt động" cần ưu tiên hiển thị
      if (['SERVING', 'FINISHING', 'PROCESSING', 'CALLING'].includes(item.status)) {
        active.push(item);
      } else {
        waiting.push(item);
      }
    });

    return { activeQueue: active, waitingQueue: waiting };
  }, [queue]);

  // 2. Tính toán danh sách "Đang chờ" sẽ hiển thị
  const visibleWaitingQueue = isExpanded 
    ? waitingQueue 
    : waitingQueue.slice(0, INITIAL_WAITING_LIMIT);
  
  const hiddenCount = waitingQueue.length - visibleWaitingQueue.length;

  // Hàm render item (tách ra cho gọn)
  const renderQueueItem = (item: any) => {
    const isMyTicket = highlightTicketId && item.id === highlightTicketId;
    const isInProgress = ['SERVING', 'FINISHING', 'PROCESSING', 'CALLING'].includes(item.status);
    const isAssignedBarber = item.barber?.userId === currentUserId;
    
    // Logic hiển thị nút Finish
    const showFinishButton = (currentUserRole === 'BARBER' || currentUserRole === 'ADMIN') && 
                             ['SERVING', 'FINISHING'].includes(item.status) &&
                             isAssignedBarber;
                             
    const isProcessing = item.status === 'PROCESSING';
    const isOverdue = item.status === 'SKIPPED' || item.status === 'CANCELLED';
    
    const avatarUrl = item.user?.avatarUrl;
    const displayName = item.guestName || item.user?.fullName || 'Khách';
    const initial = displayName.charAt(0).toUpperCase();

    return (
      <div
        key={item.id}
        onClick={() => setSelectedTicket(item)}
        className={`
          p-4 flex items-start gap-3 transition-colors duration-300 relative cursor-pointer hover:bg-accent/50 border-b border-border last:border-0
          ${isMyTicket ? 'bg-amber-50/80 dark:bg-amber-900/10' : ''}
          ${isInProgress ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}
          ${isOverdue ? 'opacity-60 bg-red-50/50 grayscale-[0.5]' : ''}
        `}
      >
        {/* AVATAR */}
        <div className="relative shrink-0 pt-1">
            <div className={`
                w-12 h-12 md:w-14 md:h-14 rounded-full border-2 overflow-hidden flex items-center justify-center bg-muted
                ${isMyTicket ? 'border-amber-500 ring-2 ring-amber-200 ring-offset-1' : 'border-border'}
                ${isInProgress && !isMyTicket ? 'border-indigo-500' : ''}
            `}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                    <span className="font-black text-lg text-muted-foreground select-none">{initial}</span>
                )}
            </div>
            {isMyTicket && (
                <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 shadow border border-amber-200">
                    <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                </div>
            )}
        </div>

        {/* CONTENT */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            <span className={`
                mt-0.5 px-1.5 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-wider shrink-0
                ${isMyTicket ? 'bg-amber-500 text-white shadow-sm' : 'bg-muted text-muted-foreground border border-border'}
            `}>
                #{item.ticketNumber}
            </span>
            <p className="font-bold text-foreground text-sm md:text-base break-words line-clamp-2 leading-tight">
                {displayName}
            </p>
          </div>
          
          <div className="flex justify-between items-end gap-2 w-full mt-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {isInProgress ? (
                      <>
                        <Scissors className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-medium text-indigo-600">
                            {isProcessing 
                            ? 'Đang ngấm thuốc' 
                            : item.barber 
                              ? `${item.barber.name}` 
                              : 'Đang cắt'}
                        </span>
                      </>
                  ) : isOverdue ? (
                      <span className="text-red-500 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5"/> Đã hủy
                      </span>
                  ) : (
                      <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5"/> Đang chờ
                      </span>
                  )}
              </div>

              <div className="shrink-0 flex items-center gap-2">
                  {isProcessing && <Sparkles className="w-5 h-5 text-purple-500 animate-spin-slow" />}
                  {!isProcessing && isInProgress && !showFinishButton && <Scissors className="w-5 h-5 text-indigo-400 animate-bounce" />}
                  
                  {showFinishButton && (
                      <div 
                        className="relative z-20" 
                        onClick={(e) => e.stopPropagation()} 
                      > 
                          <CompleteTicketButton ticketId={item.id} />
                      </div>
                  )}
                  
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </div>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER CHÍNH ---

  if (queue.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-8 md:p-12 text-center mx-auto w-full">
        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center animate-pulse">
          <Clock className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
        </div>
        <p className="text-foreground font-bold text-lg">Sàn đang trống!</p>
        <p className="text-sm text-muted-foreground mt-1">Lấy số ngay để được cắt đầu tiên.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden w-full mx-auto transition-all duration-300">
        
        {/* Header List */}
        <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
              Hàng đợi
              <span className="text-[10px] font-normal bg-white/20 px-2 py-0.5 rounded-full">
                {queue.length} khách
              </span>
          </h3>
          <span className="text-[10px] bg-background text-foreground px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            LIVE
          </span>
        </div>

        {/* --- NHÓM 1: ĐANG PHỤC VỤ (Luôn hiển thị) --- */}
        {activeQueue.length > 0 && (
          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30">
             <div className="px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Scissors className="w-3 h-3" /> Đang thực hiện ({activeQueue.length})
             </div>
             <div>
                {activeQueue.map(item => renderQueueItem(item))}
             </div>
          </div>
        )}

        {/* --- NHÓM 2: ĐANG CHỜ (Hiển thị giới hạn) --- */}
        <div>
           {waitingQueue.length > 0 && activeQueue.length > 0 && (
              <div className="px-4 py-2 bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 border-b border-border">
                <Clock className="w-3 h-3" /> Đang xếp hàng ({waitingQueue.length})
              </div>
           )}
           
           <div>
              {visibleWaitingQueue.map(item => renderQueueItem(item))}
           </div>
        </div>

        {/* --- NÚT XEM THÊM / THU GỌN --- */}
        {hiddenCount > 0 && !isExpanded && (
            <div 
                onClick={() => setIsExpanded(true)}
                className="p-3 text-center border-t border-border cursor-pointer hover:bg-accent/50 transition-colors group"
            >
                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary flex items-center justify-center gap-1">
                    Xem thêm {hiddenCount} khách đang chờ <ChevronDown className="w-4 h-4" />
                </span>
            </div>
        )}

        {isExpanded && waitingQueue.length > INITIAL_WAITING_LIMIT && (
            <div 
                onClick={() => setIsExpanded(false)}
                className="p-3 text-center border-t border-border cursor-pointer hover:bg-accent/50 transition-colors group"
            >
                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary flex items-center justify-center gap-1">
                    Thu gọn danh sách <ChevronUp className="w-4 h-4" />
                </span>
            </div>
        )}

      </div>

      {/* Modal Detail */}
      {selectedTicket && (
          <QueueDetailModal 
              ticket={selectedTicket}
              isOpen={!!selectedTicket}
              onClose={() => setSelectedTicket(null)}
              currentUserRole={currentUserRole}
          />
      )}
    </>
  );
}