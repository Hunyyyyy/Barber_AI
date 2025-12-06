// components/queue/QueueCard.tsx
import { Clock, Users } from 'lucide-react';

interface QueueCardProps {
  waitingCount: number;
  estimatedWaitTime: number;
}

export default function QueueCard({ waitingCount, estimatedWaitTime }: QueueCardProps) {
  return (
    <div className="w-full max-w-lg mx-auto bg-primary text-primary-foreground p-5 md:p-6 rounded-2xl shadow-xl shadow-primary/20 mb-6 relative overflow-hidden group">
      {/* Background Effect */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-background/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Trạng thái quán</h2>
          <div className="flex items-end gap-2">
            <span className="text-4xl md:text-5xl font-black leading-none tracking-tighter">{waitingCount}</span>
            <span className="text-sm md:text-base font-medium opacity-90 mb-1">khách chờ</span>
          </div>
        </div>
        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm shadow-inner border border-white/10">
          <Users className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 opacity-80" />
          <span className="text-xs md:text-sm font-medium opacity-80">Chờ dự kiến</span>
        </div>
        <span className="text-lg md:text-xl font-bold tracking-tight">~{estimatedWaitTime} phút</span>
      </div>
    </div>
  );
}