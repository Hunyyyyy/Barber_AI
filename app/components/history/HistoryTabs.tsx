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
    <div className="flex p-1 bg-neutral-100 rounded-xl mb-8 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap
            ${active === tab.id 
              ? 'bg-white text-black shadow-sm ring-1 ring-black/5' 
              : 'text-neutral-500 hover:text-black hover:bg-neutral-200/50'
            }
          `}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}