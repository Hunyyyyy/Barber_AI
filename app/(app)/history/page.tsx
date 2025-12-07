//app\(app)\history\page.tsx


export const dynamic = 'force-dynamic';
import { getAIHistory, getBookingHistory, getSavedCollection, getTransactionHistory } from '@/actions/history.actions';
import AIAnalysisCard from '@/components/history/AIAnalysisCard';
import BookingCard from '@/components/history/BookingCard';
import CollectionCard from '@/components/history/CollectionCard';
import EmptyState from '@/components/history/EmptyState';
import HistoryTabs from '@/components/history/HistoryTabs';
import TransactionCard from '@/components/history/TransactionCard';
import {
    AIHistoryItem,
    BookingHistoryItem,
    CollectionItem,
    TransactionHistoryItem
} from '@/types/history'; // [1] Import Type vừa tạo
import { History, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState('booking');
  const [loading, setLoading] = useState(true);

  // [2] Khai báo State với Type cụ thể
  const [data, setData] = useState<{
    bookings: BookingHistoryItem[];
    transactions: TransactionHistoryItem[];
    aiHistory: AIHistoryItem[];
    collection: CollectionItem[];
  }>({ 
    bookings: [], 
    transactions: [], 
    aiHistory: [], 
    collection: [] 
  });

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [bookingRes, transRes, aiRes, colRes] = await Promise.all([
                getBookingHistory(),
                getTransactionHistory(),
                getAIHistory(),
                getSavedCollection()
            ]);

            // [3] TypeScript sẽ tự động kiểm tra và map dữ liệu ở đây
            // Ép kiểu (as ...) nếu server action trả về type chưa khớp hoàn toàn, 
            // hoặc dùng ?? [] để đảm bảo không undefined.
            setData({
                bookings: (bookingRes.success ? bookingRes.data : []) as BookingHistoryItem[],
                transactions: (transRes.success ? transRes.data : []) as TransactionHistoryItem[],
                aiHistory: (aiRes.success ? aiRes.data : []) as AIHistoryItem[],
                collection: (colRes.success ? colRes.data : []) as CollectionItem[],
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

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

        {/* Content Area */}
        {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-neutral-300">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-xs font-medium uppercase tracking-widest">Đang tải dữ liệu...</p>
            </div>
        ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* 1. BOOKINGS */}
                {activeTab === 'booking' && (
                    <div className="space-y-4">
                        {data.bookings.length > 0 ? (
                            data.bookings.map(item => <BookingCard key={item.id} item={item} />)
                        ) : (
                            <EmptyState title="Chưa có lịch hẹn" desc="Bạn chưa đặt lịch cắt tóc lần nào." href="/queue" btn="Đặt lịch ngay" />
                        )}
                    </div>
                )}

                {/* 2. AI HISTORY */}
                {activeTab === 'ai' && (
                    <div className="grid grid-cols-2 gap-4">
                        {data.aiHistory.length > 0 ? (
                            data.aiHistory.map(item => <AIAnalysisCard key={item.id} item={item} />)
                        ) : (
                            <div className="col-span-2">
                                <EmptyState title="Chưa dùng AI" desc="Hãy thử phân tích khuôn mặt để tìm kiểu tóc đẹp." href="/try-hair" btn="Thử ngay" />
                            </div>
                        )}
                    </div>
                )}

                {/* 3. COLLECTION */}
                {activeTab === 'collection' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {data.collection.length > 0 ? (
                            data.collection.map(item => <CollectionCard key={item.id} item={item} />)
                        ) : (
                            <div className="col-span-full">
                                <EmptyState title="Bộ sưu tập trống" desc="Lưu các kiểu tóc bạn thích vào đây nhé." href="/try-hair" btn="Khám phá" />
                            </div>
                        )}
                    </div>
                )}

                {/* 4. TRANSACTIONS */}
                {activeTab === 'transaction' && (
                    <div className="space-y-3">
                        {data.transactions.length > 0 ? (
                            data.transactions.map(item => <TransactionCard key={item.id} item={item} />)
                        ) : (
                            <EmptyState title="Chưa có giao dịch" desc="Lịch sử nạp Credit sẽ hiện ở đây." href="/profile" btn="Nạp Credit" />
                        )}
                    </div>
                )}

            </div>
        )}
      </div>
    </div>
  );
}