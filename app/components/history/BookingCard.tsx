'use client';

import { formatCurrency } from '@/lib/utils';
import { Scissors, User } from 'lucide-react';

export default function BookingCard({ item }: { item: any }) {
  const isCompleted = item.status === 'COMPLETED' || item.status === 'PAID';
  const isCancelled = item.status === 'CANCELLED';
  
  return (
    <div className="group bg-white border border-neutral-200 rounded-2xl p-5 hover:border-black transition-colors duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100">
            <Scissors className="w-5 h-5 text-neutral-900" />
          </div>
          <div>
            <p className="font-bold text-neutral-900">Vé #{item.ticketNumber}</p>
            <p className="text-xs text-neutral-500 font-medium">
              {new Date(item.date).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
        <div className={`
          px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border
          ${isCompleted ? 'bg-neutral-900 text-white border-neutral-900' : ''}
          ${isCancelled ? 'bg-white text-neutral-400 border-neutral-200 line-through' : ''}
          ${!isCompleted && !isCancelled ? 'bg-white text-neutral-900 border-neutral-900 animate-pulse' : ''}
        `}>
          {item.status}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {item.services.map((s: any) => (
          <div key={s.service.id} className="flex justify-between text-sm">
            <span className="text-neutral-600">{s.service.name}</span>
            <span className="font-medium">{formatCurrency(s.priceSnapshot)}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-dashed border-neutral-200 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <User className="w-3 h-3" />
          <span>Stylist: {item.barber?.name || 'Ngẫu nhiên'}</span>
        </div>
        <span className="text-lg font-black text-neutral-900">{formatCurrency(item.totalPrice)}</span>
      </div>
    </div>
  );
}