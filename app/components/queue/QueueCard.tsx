// components/queue/QueueCard.tsx
import { Clock, Users } from 'lucide-react';

interface QueueCardProps {
  waitingCount: number;
  estimatedWaitTime: number;
}

export default function QueueCard({ waitingCount, estimatedWaitTime }: QueueCardProps) {
  return (
    <div className="bg-black text-white p-6 rounded-2xl shadow-lg mb-6 relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gray-800 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Trạng thái quán</h2>
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-bold">{waitingCount}</span>
            <span className="text-gray-400">khách đang chờ</span>
          </div>
        </div>
        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
          <Users className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">Thời gian chờ dự kiến</span>
        </div>
        <span className="text-xl font-semibold">~{estimatedWaitTime} phút</span>
      </div>
    </div>
  );
}