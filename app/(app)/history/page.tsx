// app/(app)/history/page.tsx
"use client";

import AIHistoryList from '@/components/history/AIHistoryList';
import BookingList from '@/components/history/BookingList';
import CollectionList from '@/components/history/CollectionList';
import HistoryTabs from '@/components/history/HistoryTabs';
import TransactionList from '@/components/history/TransactionList';
import { History } from 'lucide-react';
import { useState } from 'react';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState('booking');

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-20">
      <div className="max-w-3xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tighter mb-2 flex items-center gap-3">
                <History className="w-8 h-8" />
                Hoạt động
            </h1>
            <p className="text-neutral-500">Xem lại lịch sử và bộ sưu tập của bạn.</p>
        </div>

        {/* Navigation */}
        <HistoryTabs active={activeTab} onChange={setActiveTab} />

        {/* Content Area - Conditional Rendering 
            Khi switch tab, component cũ unmount, component mới mount và gọi useEffect để fetch data
        */}
        <div className="min-h-[400px]">
            {activeTab === 'booking' && <BookingList />}
            {activeTab === 'ai' && <AIHistoryList />}
            {activeTab === 'collection' && <CollectionList />}
            {activeTab === 'transaction' && <TransactionList />}
        </div>

      </div>
    </div>
  );
}