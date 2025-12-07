// components/history/AIHistoryList.tsx
"use client";

import { deleteAIHistory, getAIHistory } from "@/actions/history.actions";
import PaginationControls from "@/components/ui/PaginationControls";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AIAnalysisCard from "./AIAnalysisCard";
import AIAnalysisDetailModal from "./AIAnalysisDetailModal"; // 1. Import the modal
import EmptyState from "./EmptyState";

export default function AIHistoryList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null); // 2. State for modal

  const fetchData = async () => {
    setLoading(true);
    const res = await getAIHistory(page, 6); // Limit 6 (grid 2 cols)
    if (res.success) {
      setData(res.data || []);
      setTotalPages(res.totalPages || 1);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleDelete = async (id: string) => {
    if (deletingId) return; // Prevent multiple clicks
    if (!confirm("Xóa kết quả phân tích này?")) return;
    
    setDeletingId(id);
    try {
      const res = await deleteAIHistory(id);
      if (res.success) {
        toast.success("Đã xóa");
        setData(prevData => prevData.filter(item => item.id !== id));
      } else {
        toast.error(res.error || "Lỗi: Không thể xóa.");
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi xóa.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && data.length === 0) return <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground"/></div>;

  if (!loading && data.length === 0) return <EmptyState title="Chưa dùng AI" desc="Thử phân tích ngay." href="/try-hair" btn="Thử ngay" />;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
        {data.map((item) => {
          const isDeleting = deletingId === item.id;
          return (
            <div key={item.id} className={`relative group/wrapper`}>
              <div className={`transition-opacity ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                <AIAnalysisCard 
                  item={item}
                  onClick={() => setSelectedItem(item)} // 3. Set selected item on click
                />
              </div>
               <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} // 4. Stop propagation
                disabled={isDeleting}
                className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover/wrapper:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />

      {/* 5. Render the modal */}
      <AIAnalysisDetailModal 
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}