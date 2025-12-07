"use client";

import { deleteBooking, getBookingHistory } from "@/actions/history.actions";
import PaginationControls from "@/components/ui/PaginationControls";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner"; // Đã uncomment
import BookingCard from "./BookingCard";
import EmptyState from "./EmptyState";

export default function BookingList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null); // Thêm state xóa

  const fetchData = async () => {
    setLoading(true);
    const res = await getBookingHistory(page, 5); 
    if (res.success) {
      setData(res.data || []);
      setTotalPages(res.totalPages || 1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!confirm("Bạn có chắc muốn xóa lịch sử đặt lịch này?")) return;
    
    setDeletingId(id);
    try {
      const res = await deleteBooking(id);
      if (res.success) {
        toast.success("Đã xóa lịch sử đặt lịch");
        setData(prev => prev.filter(item => item.id !== id));
      } else {
        toast.error(res.error || "Không thể xóa");
      }
    } catch(e) {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && data.length === 0) return <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground"/></div>;

  if (!loading && data.length === 0) return <EmptyState title="Chưa có lịch hẹn" desc="Bạn chưa đặt lịch lần nào." href="/queue" btn="Đặt lịch ngay" />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      {data.map((item) => {
        const isDeleting = deletingId === item.id;
        return (
          <div key={item.id} className={`relative group/wrapper ${isDeleting ? 'opacity-60 pointer-events-none' : ''}`}>
            <BookingCard item={item} />
            
            <button 
              onClick={() => handleDelete(item.id)}
              disabled={isDeleting}
              className="absolute top-3 right-3 p-2 bg-background border shadow-sm text-red-500 rounded-full opacity-0 group-hover/wrapper:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 disabled:opacity-100"
              title="Xóa lịch sử"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        )
      })}
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
    </div>
  );
}