'use client';

import { Calendar, Coins, Layers, Sparkles } from 'lucide-react';

interface HistoryTabsProps {
  active: string;
  onChange: (v: string) => void;
}

export default function HistoryTabs({ active, onChange }: HistoryTabsProps) {
  const tabs = [
    { id: 'booking', label: 'Lịch hẹn', icon: Calendar },
    { id: 'ai', label: 'Lịch sử AI', icon: Sparkles },
    { id: 'collection', label: 'Bộ sưu tập', icon: Layers },
    { id: 'transaction', label: 'Giao dịch', icon: Coins },
  ];

  return (
    // SỬA: Chuyển từ flex sang grid trên mobile (grid-cols-2) và flex trên desktop (md:flex)
    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl mb-8 border border-border md:flex md:gap-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center justify-center gap-2 py-3 px-3 rounded-lg font-bold transition-all
            
            /* Responsive: Chữ nhỏ hơn trên mobile (text-xs) và lớn hơn trên desktop (md:text-sm) */
            text-xs md:text-sm md:flex-1 whitespace-nowrap

            ${active === tab.id 
              ? 'bg-background text-foreground shadow-sm ring-1 ring-border' 
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }
          `}
        >
          {/* Icon cũng resize nhẹ để cân đối */}
          <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}