// components/queue/ShopHeader.tsx
import { MapPin, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

interface ShopHeaderProps {
  hasTicket: boolean;
}

export default function ShopHeader({ hasTicket }: ShopHeaderProps) {
  return (
    <header className="px-6 py-6 bg-white sticky top-0 z-20 border-b border-gray-100/50 backdrop-blur-md bg-white/80">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            BARBER<span className="text-gray-400">QUEUE</span>
          </h1>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <MapPin className="w-3 h-3 mr-1" />
            <span>123 Nguyễn Huệ, Huế</span>
            <span className="mx-2">•</span>
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            <span className="text-green-600 font-medium">Đang mở cửa</span>
          </div>
        </div>
        <Link
          href={hasTicket ? "/queue/my-ticket" : "#"}
          className="relative w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5 text-black" />
          {hasTicket && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </Link>
      </div>
    </header>
  );
}