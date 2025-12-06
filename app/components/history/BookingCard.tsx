'use client';

import { formatCurrency } from '@/lib/utils';
import { Scissors, User } from 'lucide-react';

export default function BookingCard({ item }: { item: any }) {
  const isCompleted = item.status === 'COMPLETED' || item.status === 'PAID';
  const isCancelled = item.status === 'CANCELLED';
  
  return (
    // SỬA: bg-card, border-border, text-card-foreground
    <div className="group bg-card border border-border rounded-2xl p-5 hover:border-primary transition-colors duration-300 shadow-sm hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {/* SỬA: bg-muted, text-foreground */}
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center border border-border">
            <Scissors className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground">Vé #{item.ticketNumber}</p>
            <p className="text-xs text-muted-foreground font-medium">
              {new Date(item.date).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
        
        <div className={`
          px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border
          ${isCompleted 
              ? 'bg-primary text-primary-foreground border-primary' 
              : ''}
          ${isCancelled 
              ? 'bg-muted text-muted-foreground border-border line-through' 
              : ''}
          ${!isCompleted && !isCancelled 
              ? 'bg-background text-foreground border-foreground animate-pulse' 
              : ''}
        `}>
          {item.status}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {item.services.map((s: any) => (
          <div key={s.service.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{s.service.name}</span>
            <span className="font-medium text-foreground">{formatCurrency(s.priceSnapshot)}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-dashed border-border flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="w-3 h-3" />
          <span>Stylist: {item.barber?.name || 'Ngẫu nhiên'}</span>
        </div>
        <span className="text-lg font-black text-primary">{formatCurrency(item.totalPrice)}</span>
      </div>
    </div>
  );
}