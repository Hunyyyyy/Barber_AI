// components/queue/CurrentQueueList.tsx
"use client";

import { AlertCircle, ChevronRight, Clock, Crown, Scissors, Sparkles } from 'lucide-react';
import { useState } from 'react';
import CompleteTicketButton from './CompleteTicketButton';
import QueueDetailModal from './QueueDetailModal';

interface CurrentQueueListProps {
  queue: any[];
  highlightTicketId?: string;
  currentUserRole?: string | null;
  currentUserId?: string;
}

export default function CurrentQueueList({ 
  queue, highlightTicketId, currentUserRole, currentUserId 
}: CurrentQueueListProps) { 
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

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
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden w-full mx-auto">
        {/* Header List */}
        <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
              Hàng đợi
              <span className="text-[10px] font-normal bg-white/20 px-2 py-0.5 rounded-full">{queue.length}</span>
          </h3>
          <span className="text-[10px] bg-background text-foreground px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            LIVE
          </span>
        </div>

        <div className="divide-y divide-border">
          {queue.map((item) => {
            const isMyTicket = highlightTicketId && item.id === highlightTicketId;
            const isInProgress = ['SERVING', 'FINISHING', 'PROCESSING', 'CALLING'].includes(item.status);
            const isAssignedBarber = item.barber?.userId === currentUserId;
            
            // Logic hiển thị nút: Nếu là Barber/Admin VÀ trạng thái đang phục vụ/hoàn thiện VÀ đúng thợ được gán
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
                // Cursor pointer để người dùng biết bấm vào được
                className={`
                  p-4 flex items-start gap-3 transition-colors duration-300 relative cursor-pointer hover:bg-accent/50
                  ${isMyTicket ? 'bg-amber-50/80 dark:bg-amber-900/10' : ''}
                  ${isInProgress ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
                  ${isOverdue ? 'opacity-60 bg-red-50/50 grayscale-[0.5]' : ''}
                `}
              >
                {/* 1. AVATAR */}
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

                {/* 2. MAIN CONTENT */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  
                  {/* Dòng 1: Badge Số vé + Tên Khách Hàng */}
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
                  
                  {/* Dòng 2: Trạng thái + Nút Thao tác */}
                  <div className="flex justify-between items-end gap-2 w-full mt-1">
                      {/* Trạng thái text */}
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

                      {/* Các nút thao tác */}
                      <div className="shrink-0 flex items-center gap-2">
                          {isProcessing && <Sparkles className="w-5 h-5 text-purple-500 animate-spin-slow" />}
                          {!isProcessing && isInProgress && !showFinishButton && <Scissors className="w-5 h-5 text-indigo-400 animate-bounce" />}
                          
                          {/* NÚT THỢ CẮT XONG */}
                          {showFinishButton && (
                              <div 
                                className="relative z-20" 
                                onClick={(e) => e.stopPropagation()} // Quan trọng: Chặn sự kiện click để không mở Modal
                              > 
                                  <CompleteTicketButton ticketId={item.id} />
                              </div>
                          )}
                          
                          {/* Mũi tên chỉ dẫn */}
                          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Render Modal ở cuối Component */}
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